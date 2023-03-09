import express from "express";
import Joi from "joi";
import config from "../../../config.js";
import { passwordSchema, validateFullObjectSchema } from "../../../common/utils/validationUtils.js";
import passport from "passport";
import { createResetPasswordToken, createUserTokenSimple } from "../../../common/utils/jwtUtils.js";
import { Strategy, ExtractJwt } from "passport-jwt";
import {
  changePassword,
  getUserByEmail,
  updateUserLastConnection,
  structureUser,
} from "../../../common/actions/users.actions.js";
import * as sessions from "../../../common/actions/sessions.actions.js";
import { responseWithCookie } from "../../../common/utils/httpUtils.js";
import { returnResult } from "../../middlewares/helpers.js";

const checkPasswordToken = () => {
  passport.use(
    "jwt-password",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("passwordToken"),
        secretOrKey: config.auth.resetPasswordToken.jwtSecret,
      },
      (jwt_payload, done) => {
        return getUserByEmail(jwt_payload.sub)
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
    returnResult(async (req) => {
      const { email, noEmail } = await validateFullObjectSchema(req.body, {
        email: Joi.string().email().required().lowercase().trim(),
        noEmail: Joi.boolean(),
      });

      const user = await getUserByEmail(email);
      if (!user) {
        return {};
      }

      const token = createResetPasswordToken(user.email);

      if (noEmail) {
        return { token };
      }

      await mailer.sendEmail({ to: user.email, payload: user }, "reset_password");

      return {};
    })
  );

  router.post(
    "/reset-password",
    checkPasswordToken(),
    returnResult(async (req, res) => {
      const user = req.user;

      const { newPassword } = await validateFullObjectSchema(req.body, {
        passwordToken: Joi.string().required(),
        newPassword: passwordSchema(user.is_admin).required(),
      });
      // TODO ISSUE! DO NOT DISPLAY PASSWORD IN SERVER LOG

      const updatedUser = await changePassword(user.email, newPassword);

      const payload = await structureUser(updatedUser);

      await updateUserLastConnection(payload.email);

      const token = createUserTokenSimple({ payload: { email: payload.email } });
      await sessions.addJwt(token);

      responseWithCookie({ res, token });
      return {
        loggedIn: true,
        token,
      };
    })
  );

  return router;
};
