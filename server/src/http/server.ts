import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import Boom from "boom";
Boom.unauthorized();
import { apiRoles } from "../common/roles.js";

import logMiddleware from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication.js";
import legacyUserPermissionsMiddleware from "./middlewares/legacyUserPermissionsMiddleware.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

import indicateursExportRouter from "./routes/specific.routes/indicateurs-export.routes.js";
import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes.js";
import organismesRouter from "./routes/specific.routes/organismes.routes.js";
import indicateursNationalRouter from "./routes/specific.routes/indicateurs-national.routes.js";
import indicateursRouter from "./routes/specific.routes/indicateurs.routes.js";
import serverEvents from "./routes/specific.routes/server-events.routes.js";

import emails from "./routes/emails.routes.js";

import auth from "./routes/user.routes/auth.routes.js";
import register from "./routes/user.routes/register.routes.js";
import password from "./routes/user.routes/password.routes.js";
import profile from "./routes/user.routes/profile.routes.js";

import organisme from "./routes/specific.routes/organisme.routes.js";
import effectif from "./routes/specific.routes/effectif.routes.js";
import upload from "./routes/specific.routes/serp.routes/upload.routes.js";

import usersAdmin from "./routes/admin.routes/users.routes.js";
import organismesAdmin from "./routes/admin.routes/organismes.routes.js";
import statsAdmin from "./routes/admin.routes/stats.routes.js";
import maintenancesAdmin from "./routes/admin.routes/maintenances.routes.js";
import config from "../config.js";

// catch all unhandled promise rejections and call the error middleware
import "express-async-errors";
import { returnResult } from "./middlewares/helpers.js";
import { jobEventsDb } from "../common/model/collections.js";
import { packageJson } from "../common/utils/esmUtils.js";
import logger from "../common/logger.js";
import { findMaintenanceMessages } from "../common/actions/maintenances.actions.js";
import { findUserOrganismes } from "../common/actions/organismes/organismes.actions.js";
import { validateFullObjectSchema } from "../common/utils/validationUtils.js";
import { getFormationWithCfd, searchFormations } from "../common/actions/formations.actions.js";
import Joi from "joi";
import { RESEAUX_CFAS } from "../common/constants/networksConstants.js";
import { ORGANISMES_APPARTENANCE } from "../common/constants/usersConstants.js";
import { authenticateLegacy } from "../common/actions/legacy/users.legacy.actions.js";
import { createUserToken } from "../common/utils/jwtUtils.js";
import { createUserEvent } from "../common/actions/userEvents.actions.js";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../common/constants/userEventsConstants.js";
import { updateUserLastConnection, structureUser } from "../common/actions/users.actions.js";

/**
 * Create the express app
 * @param {Object} services - Services
 * @param {Object} services.cache - Redis cache
 * @param {Object} services.clamav - clamav antivirus
 * @param {Object} services.mailer - Mailer
 *
 * @returns {Promise<Object>} Express app
 */
export default async (services) => {
  const app = express();

  // Configure Sentry
  Sentry.init({
    dsn: config.sentry.dsn || "",
    enabled: !!config.sentry.dsn,
    environment: config.env,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: config.env !== "production" ? 1.0 : 0.2,
  });
  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  const checkJwtToken = authMiddleware();

  app.use(bodyParser.json());
  app.use(logMiddleware());
  app.use(cookieParser());
  app.use(passport.initialize());

  app.get(
    "/api",
    returnResult(async () => {
      return {
        name: "TDB Apprentissage API",
        version: packageJson.version,
        env: config.env,
      };
    })
  );
  app.get(
    "/api/healthcheck",
    returnResult(async () => {
      let mongodbHealthy = false;
      try {
        await jobEventsDb().findOne({});
        mongodbHealthy = true;
      } catch (err) {
        logger.error({ err }, "healthcheck failed");
      }

      return {
        name: "TDB Apprentissage API",
        version: packageJson.version,
        env: config.env,
        healthcheck: {
          mongodb: mongodbHealthy,
        },
      };
    })
  );

  // public access
  app.use("/api/emails", emails(services)); // No versionning to be sure emails links are always working
  app.use("/api/v1/auth", auth());
  app.use("/api/v1/auth", register(services));
  app.use("/api/v1/password", password(services));
  app.use(
    "/api/v1/maintenanceMessages",
    returnResult(async () => {
      return await findMaintenanceMessages();
    })
  );

  // private access
  app.get(
    "/api/v1/session/current",
    checkJwtToken,
    returnResult(async (req) => {
      return req.user;
    })
  );
  app.use("/api/v1/profile", checkJwtToken, profile());

  app.get(
    "/api/v1/espace/organismes",
    checkJwtToken,
    returnResult(async (req) => {
      return findUserOrganismes(req.user);
    })
  );
  app.use("/api/v1/organisme", checkJwtToken, organisme(services));
  app.use("/api/v1/effectif", checkJwtToken, effectif());
  app.use("/api/v1/upload", checkJwtToken, upload(services));
  app.use("/api/v1/server-events", checkJwtToken, serverEvents());

  // private admin access
  app.use(
    "/api/v1/admin",
    checkJwtToken,
    // pageAccessMiddleware(["admin/page_gestion_utilisateurs"]),
    usersAdmin(services)
  );
  app.use("/api/v1/admin", checkJwtToken, organismesAdmin());
  app.use("/api/v1/admin", checkJwtToken, statsAdmin());
  app.use(
    "/api/v1/admin/maintenanceMessages",
    checkJwtToken,
    // pageAccessMiddleware(["admin/page_message_maintenance"]),
    maintenancesAdmin()
  );

  // Routes de calcul & export des indicateurs
  app.use(
    // FRONT
    ["/api/indicateurs"],
    checkJwtToken,
    // indicateursPermissions(),
    indicateursRouter()
  );

  app.use("/api/indicateurs-national", indicateursNationalRouter(services)); // FRONT

  app.use(
    // FRONT
    "/api/v1/indicateurs-export",
    checkJwtToken,
    // indicateursPermissions(),
    indicateursExportRouter()
  );

  // Route pour ancien mécanisme de login : ERP TRANSMISSION => 4 erps GESTI,YMAG,SCFORM, FORMASUP PARIS HAUT DE FRANCE
  app.post(
    "/api/login",
    returnResult(async (req) => {
      const { username, password } = req.body;
      const authenticatedUser = await authenticateLegacy(username, password);
      if (!authenticatedUser) {
        throw Boom.unauthorized();
      }
      await createUserEvent({ username, type: USER_EVENTS_TYPES.POST, action: USER_EVENTS_ACTIONS.LOGIN });
      return { access_token: createUserToken(authenticatedUser) };
    })
  );

  app.use(
    [
      "/api/statut-candidats", // @deprecated to /dossiers-apprenants
      "/api/dossiers-apprenants",
    ],
    requireJwtAuthenticationMiddleware(),
    legacyUserPermissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter()
  );

  app.use(
    "/api/organismes",
    requireApiKeyAuthenticationMiddleware({ apiKeyValue: config.organismesConsultationApiKey }),
    organismesRouter()
  ); // EXPOSED TO REFERENTIEL PROTECTED BY API KEY

  /*
   * formations
   */
  const formationsSearchSchema = {
    searchTerm: Joi.string().min(3),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  };
  app.post(
    "/api/formations/search",
    returnResult(async (req) => {
      const formationSearch = await validateFullObjectSchema(req.body, formationsSearchSchema);
      return await searchFormations(formationSearch);
    })
  );

  app.get(
    "/api/formations/:cfd",
    returnResult(async (req) => {
      return await getFormationWithCfd(req.params.cfd);
    })
  );

  /*
   * referentiel
   */
  app.get(
    "/api/referentiel/networks",
    returnResult(() => {
      // TODO : TMP on ne renvoie que les réseaux fiabilisés pour l'instant - débloquer le reste quand ce sera fiable
      const RESEAUX_CFAS_INVALID = ["ANASUP", "GRETA_VAUCLUSE", "BTP_CFA"];
      const networks = Object.keys(RESEAUX_CFAS)
        .filter((item) => !RESEAUX_CFAS_INVALID.includes(item))
        .map((id) => ({ id, nom: RESEAUX_CFAS[id].nomReseau }));
      return networks;
    })
  );

  app.get(
    "/api/referentiel/organismes-appartenance",
    returnResult(() => {
      const organismes = Object.keys(ORGANISMES_APPARTENANCE).map((id) => ({ id, nom: ORGANISMES_APPARTENANCE[id] }));
      return organismes;
    })
  );

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  app.use(errorMiddleware());

  return app;
};
