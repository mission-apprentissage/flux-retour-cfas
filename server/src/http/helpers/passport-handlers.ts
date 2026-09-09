import * as Sentry from "@sentry/node";
import Boom from "boom";
import { ObjectId } from "mongodb";
import passport from "passport";
import { Strategy, ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";

import { getAcl } from "@/common/actions/helpers/permissions-organisme";
import { getOrganisationById } from "@/common/actions/organisations.actions";
import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import { findSessionByToken } from "@/common/actions/sessions.actions";
import { getUserByEmail } from "@/common/actions/users.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import logger from "@/common/logger";
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

          if (user.account_status !== "CONFIRMED") {
            throw Boom.forbidden("Votre compte n'est pas encore validé.");
          }

          let impersonating;

          if (jwtPayload.impersonatedOrganisation) {
            impersonating = true;
            user.organisation_id = new ObjectId(jwtPayload.impersonatedOrganisation._id);
          }
          const organisation =
            jwtPayload.impersonatedOrganisation ?? (await getOrganisationById(user.organisation_id as ObjectId));

          let organisation_nom: string | undefined;
          if (organisation.type === "ORGANISME_FORMATION" && organisation.organisme_id) {
            try {
              const organisme = await getOrganismeById(new ObjectId(organisation.organisme_id));
              if (organisme?.nom) {
                organisation_nom = organisme.nom;
              }
            } catch (err) {
              logger.warn({ err, organisme_id: organisation.organisme_id }, "Failed to enrich organisation nom");
            }
          }

          const acl = await getAcl(organisation);

          const ctx: AuthContext = {
            _id: user._id,
            civility: user.civility,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            organisation_id: user.organisation_id,
            account_status: user.account_status,
            has_accept_cgu_version: "",
            impersonating,
            organisation,
            organisation_nom,
            organisation_role: user.organisation_role,
            last_connection: user.last_connection,
            created_at: user.created_at,
            fonction: user.fonction,
            password_updated_at: user.password_updated_at,
            telephone: user.telephone,
            acl,
          };

          if (user.has_accept_cgu_version) {
            ctx.has_accept_cgu_version = user.has_accept_cgu_version;
          }

          if ("username" in user && typeof user.username === "string") {
            ctx.username = user.username;
          }
          done(null, ctx);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  const authenticate = passport.authenticate("jwtStrategy2", { session: false, failWithError: true });

  return composeMiddlewares([
    authenticate,
    // TODO stratégie à supprimer pour récupérer la session associée en BDD
    async (req, res, next) => {
      const activeSession = await findSessionByToken(req.cookies[COOKIE_NAME]);
      if (!activeSession) {
        return res.status(401).json({ error: "Accès non autorisé" });
      }

      const ctx: AuthContext = req.user;
      Sentry.setUser({
        ip: req.ip,
        id: ctx._id.toString(),
        username: ctx.email,
        segment: "jwt-2",
      });
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

/**
 * Enchaîne des middlewares Express en un seul : chaque étape n'appelle la suivante que si elle
 * n'a ni terminé la réponse ni signalé d'erreur.
 */
function composeMiddlewares(middlewares: any[]) {
  return (req: any, res: any, next: any) => {
    let index = -1;

    const run = (i: number, err?: any) => {
      if (err) return next(err);
      if (i <= index) return next(new Error("next() appelé plusieurs fois"));
      index = i;

      const middleware = middlewares[i];
      if (!middleware) return next();

      try {
        Promise.resolve(middleware(req, res, (nextErr?: any) => run(i + 1, nextErr))).catch(next);
      } catch (error) {
        next(error);
      }
    };

    run(0);
  };
}
