const express = require("express");
const Boom = require("boom");
const Joi = require("joi");
const config = require("config");
const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { createUserToken } = require("../../common/utils/jwtUtils");
const validators = require("../utils/validators");
const { createPasswordToken } = require("../../common/utils/jwtUtils");

const checkPasswordToken = (users) => {
  passport.use(
    "jwt-password",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("passwordToken"),
        secretOrKey: config.auth.password.jwtSecret,
      },
      (jwt_payload, done) => {
        return users
          .getUser(jwt_payload.sub)
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

module.exports = ({ users }) => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.post(
    "/forgotten-password",
    tryCatch(async (req, res) => {
      const { username } = await Joi.object({
        username: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false });

      if (!(await users.getUser(username))) {
        throw Boom.badRequest();
      }

      const url = `${config.publicUrl}/reset-password?passwordToken=${createPasswordToken(username)}`;
      return res.json({ url: url });
    })
  );

  router.post(
    "/reset-password",
    checkPasswordToken(users),
    tryCatch(async (req, res) => {
      const user = req.user;
      const { newPassword } = await Joi.object({
        passwordToken: Joi.string().required(),
        newPassword: validators.password().required(),
      }).validateAsync(req.body, { abortEarly: false });

      await users.changePassword(user.username, newPassword);
      return res.json({ token: createUserToken(user) });
    })
  );

  return router;
};
