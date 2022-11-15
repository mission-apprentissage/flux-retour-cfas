import config from "../../config.js";
import passport from "passport";
import { Strategy as JWTStrategy } from "passport-jwt";
import { compose } from "compose-middleware";

import { getUser, updateUser, structureUser } from "../../common/components/usersComponent.js";
import * as sessions from "../../common/components/sessionsComponent.js";
import { COOKIE_NAME } from "../../common/constants/cookieName.js";

const cookieExtractor = (req) => {
  let jwt = null;

  if (req && req.cookies) {
    jwt = req.cookies[COOKIE_NAME];
  }

  return jwt;
};

export const authMiddleware = () => {
  passport.use(
    "jwt",
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

        return getUser(jwtPayload.email)
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
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      const activeSession = await sessions.findJwt(req.cookies[COOKIE_NAME]);
      if (!activeSession) {
        return res.status(400).json({ error: "Accès non autorisé" });
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
