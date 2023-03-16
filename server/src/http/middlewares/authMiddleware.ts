import config from "../../config.js";
import passport from "passport";
import { Strategy as JWTStrategy } from "passport-jwt";
import { compose } from "compose-middleware";

import { getUserByEmail, updateUser, structureUser } from "../../common/actions/users.actions.js";
import * as sessions from "../../common/actions/sessions.actions.js";
import { COOKIE_NAME } from "../../common/constants/cookieName.js";

const cookieExtractor = (req) => {
  let jwt = null;

  if (req?.cookies) {
    jwt = req.cookies[COOKIE_NAME];
  }

  return jwt;
};

export const authMiddleware = () => {
  passport.use(
    "jwtStrategy2",
    new JWTStrategy(
      {
        jwtFromRequest: cookieExtractor,
        secretOrKey: config.auth.user.jwtSecret,
      },
      (jwtPayload, done) => {
        const { exp } = jwtPayload;

        if (Date.now() > exp * 1000) {
          done(new Error("Unauthorized"), false);
        }

        return getUserByEmail(jwtPayload.email)
          .then(async (user) => {
            if (!user) {
              return done(new Error("Unauthorized"), false);
            }
            if (user.invalided_token) {
              await updateUser(user._id, { invalided_token: false });
              return done(null, { invalided_token: true });
            }
            const result = await structureUser(user);
            return done(null, { ...result, _id: user._id });
          })
          .catch((err) => done(err));
      }
    )
  );

  return compose([
    passport.authenticate("jwtStrategy2", { session: false }),
    async (req, res, next) => {
      const activeSession = await sessions.findJwt(req.cookies[COOKIE_NAME]);
      if (!activeSession) {
        return res.status(401).json({ error: "Accès non autorisé" });
      }
      if (req.user.invalided_token) {
        await sessions.removeJwt(req.cookies[COOKIE_NAME]);
        return res.clearCookie(COOKIE_NAME).status(401).json({
          error: "Invalid jwt",
        });
      }
      next();
    },
  ]);
};
