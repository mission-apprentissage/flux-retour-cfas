import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import Joi from "joi";
import config from "../../../config.js";
import { passwordSchema } from "../../../common/utils/validationUtils.js";
import passport from "passport";
import { createResetPasswordToken, createUserToken } from "../../../common/utils/jwtUtils.js";
import { Strategy, ExtractJwt } from "passport-jwt";
import { changePassword, getUser, loggedInUser, structureUser } from "../../../common/components/usersComponent.js";
import * as sessions from "../../../common/components/sessionsComponent.js";
import { responseWithCookie } from "../../../common/utils/httpUtils.js";

const checkPasswordToken = () => {
  passport.use(
    "jwt-password",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("passwordToken"),
        secretOrKey: config.auth.resetPasswordToken.jwtSecret,
      },
      (jwt_payload, done) => {
        console.log(jwt_payload);
        return getUser(jwt_payload.sub)
          .then((user) => {
            if (!user) {
              return done(null, false);
            }
            return done(null, user);
          })
          .catch((err) => done(err));
      }
    )
  );

  return passport.authenticate("jwt-password", { session: false, failWithError: true });
};

export default ({ mailer }) => {
  const router = express.Router();

  router.post(
    "/forgotten-password",
    tryCatch(async (req, res) => {
      const { username, noEmail } = await Joi.object({
        username: Joi.string().email().required(),
        noEmail: Joi.boolean(),
      }).validateAsync(req.body, { abortEarly: false });

      const user = await getUser(username);
      if (!user) {
        return res.json({});
      }

      const token = createResetPasswordToken(user.email);

      if (noEmail) {
        return res.json({ token });
      }

      await mailer.sendEmail(user, "reset_password");

      return res.json({});
    })
  );

  router.post(
    "/reset-password",
    checkPasswordToken(),
    tryCatch(async (req, res) => {
      const user = req.user;

      const { newPassword } = await Joi.object({
        passwordToken: Joi.string().required(),
        newPassword: passwordSchema(user.is_admin).required(),
      }).validateAsync(req.body, { abortEarly: false });

      const updatedUser = await changePassword(user.email, newPassword);

      const payload = await structureUser(updatedUser);

      await loggedInUser(payload.email);

      const token = createUserToken({ payload });
      await sessions.addJwt(token);

      responseWithCookie({ res, token }).status(200).json({
        loggedIn: true,
        token,
      });
    })
  );

  return router;
};
