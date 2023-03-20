import config from "../../config.js";
import passport from "passport";
import { Strategy as JWTStrategy } from "passport-jwt";
import { compose } from "compose-middleware";

import { getUserByEmail, updateUser } from "../../common/actions/users.actions.js";
import * as sessions from "../../common/actions/sessions.actions.js";
import { COOKIE_NAME } from "../../common/constants/cookieName.js";
import { getOrganisationById } from "../../common/actions/organisations.actions.js";
import { AuthContext } from "../../common/model/internal/AuthContext.js";
import { ObjectId } from "mongodb";
import Boom from "boom";

export const authMiddleware = () => {
  passport.use(
    "jwtStrategy2",
    new JWTStrategy(
      {
        jwtFromRequest: (req) => req?.cookies?.[COOKIE_NAME] ?? null,
        secretOrKey: config.auth.user.jwtSecret,
      },
      async (jwtPayload, done) => {
        const { exp } = jwtPayload;

        if (Date.now() > exp * 1000) {
          done(new Error("Unauthorized"), false);
          return;
        }

        try {
          const user = await getUserByEmail(jwtPayload.email);
          if (!user) {
            return done(new Error("Unauthorized"), false);
          }
          // FIXME à quoi sert ce champ ?
          if (user.invalided_token) {
            await updateUser(user._id, { invalided_token: false });
            return done(null, { invalided_token: true });
          }
          if (user.account_status !== "CONFIRMED") {
            throw Boom.forbidden("Votre compte n'est pas encore validé.");
          }
          (user as unknown as AuthContext).organisation = await getOrganisationById(user.organisation_id as ObjectId);
          done(null, user);
        } catch (err) {
          done(err);
        }
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
