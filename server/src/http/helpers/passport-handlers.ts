import Boom from "boom";
import { compose } from "compose-middleware";
import { ObjectId } from "mongodb";
import passport from "passport";
import { Strategy, ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";

import { getOrganisationById } from "@/common/actions/organisations.actions";
import { findSessionByToken, removeSession } from "@/common/actions/sessions.actions";
import { getUserByEmail, updateUser } from "@/common/actions/users.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { AuthContext } from "@/common/model/internal/AuthContext";
import config from "@/config";

export const authMiddleware = () => {
  passport.use(
    "jwtStrategy2",
    new JWTStrategy(
      {
        jwtFromRequest: (req) => req?.cookies?.[COOKIE_NAME] ?? null,
        secretOrKey: config.auth.user.jwtSecret,
      },
      async (jwtPayload, done) => {
        try {
          const { exp } = jwtPayload;
          if (Date.now() > exp * 1000) {
            throw Boom.unauthorized("Vous n'êtes pas connecté");
          }
          const user = await getUserByEmail(jwtPayload.email);
          if (!user) {
            throw Boom.unauthorized("Vous n'êtes pas connecté");
          }
          // FIXME à quoi sert ce champ ?
          if (user.invalided_token) {
            await updateUser(user._id, { invalided_token: false });
            return done(null, { invalided_token: true });
          }
          if (user.account_status !== "CONFIRMED") {
            throw Boom.forbidden("Votre compte n'est pas encore validé.");
          }

          if (jwtPayload.impersonatedOrganisation) {
            (user as unknown as AuthContext).impersonating = true;
          }
          (user as unknown as AuthContext).organisation =
            jwtPayload.impersonatedOrganisation ?? (await getOrganisationById(user.organisation_id as ObjectId));
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  return compose([
    passport.authenticate("jwtStrategy2", { session: false }),
    // TODO stratégie à supprimer pour récupérer la session associée en BDD
    async (req, res, next) => {
      const activeSession = await findSessionByToken(req.cookies[COOKIE_NAME]);
      if (!activeSession) {
        return res.status(401).json({ error: "Accès non autorisé" });
      }
      if (req.user.invalided_token) {
        await removeSession(req.cookies[COOKIE_NAME]);
        return res.clearCookie(COOKIE_NAME).status(401).json({
          error: "Invalid jwt",
        });
      }
      next();
    },
  ]);
};

export const checkPasswordToken = () => {
  passport.use(
    "jwt-password",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("passwordToken"),
        secretOrKey: config.auth.resetPasswordToken.jwtSecret,
      },
      extractUserFromJWT
    )
  );

  return passport.authenticate("jwt-password", { session: false, failWithError: true });
};

export const checkActivationToken = () => {
  passport.use(
    "jwt-activation",
    new Strategy(
      {
        jwtFromRequest: ExtractJwt.fromBodyField("activationToken"),
        secretOrKey: config.auth.activation.jwtSecret,
      },
      extractUserFromJWT
    )
  );

  return passport.authenticate("jwt-activation", { session: false, failWithError: true });
};

async function extractUserFromJWT(jwtPayload: any, done: (err?: Error | null, payload?: any) => any) {
  if (Date.now() > jwtPayload.exp * 1000) {
    done(new Error("Jeton expiré"), false);
    return;
  }

  try {
    const user = await getUserByEmail(jwtPayload.sub);
    if (!user) {
      done(new Error("Unauthorized"), false);
      return;
    }
    (user as unknown as AuthContext).organisation = await getOrganisationById(user.organisation_id);
    done(null, user);
  } catch (err: any) {
    done(err);
  }
}
