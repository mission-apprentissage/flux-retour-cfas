import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import Boom from "boom";

import { apiRoles } from "../common/roles.js";

import { logMiddleware } from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication.js";
import legacyUserPermissionsMiddleware from "./middlewares/legacyUserPermissionsMiddleware.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes.js";
import organismesRouter from "./routes/specific.routes/organismes.routes.js";
import indicateursNationalRouter from "./routes/specific.routes/indicateurs-national.routes.js";
import indicateursRouter, { buildEffectifsFiltersFromRequest } from "./routes/specific.routes/indicateurs.routes.js";
import serverEvents from "./routes/specific.routes/server-events.routes.js";

import emails from "./routes/emails.routes.js";

import auth from "./routes/user.routes/auth.routes.js";
import register from "./routes/user.routes/register.routes.js";
import password from "./routes/user.routes/password.routes.js";

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
import { requireAdministrator, returnResult } from "./middlewares/helpers.js";
import { jobEventsDb } from "../common/model/collections.js";
import { packageJson } from "../common/utils/esmUtils.js";
import logger from "../common/logger.js";
import { findMaintenanceMessages } from "../common/actions/maintenances.actions.js";
import {
  findUserOrganismes,
  getOrganisme,
  OrganismesSearch,
  searchOrganismes,
} from "../common/actions/organismes/organismes.actions.js";
import { validateFullObjectSchema } from "../common/utils/validationUtils.js";
import { getFormationWithCfd, searchFormations } from "../common/actions/formations.actions.js";
import Joi from "joi";
import { RESEAUX_CFAS } from "../common/constants/networksConstants.js";
import { ORGANISMES_APPARTENANCE } from "../common/constants/usersConstants.js";
import { authenticateLegacy } from "../common/actions/legacy/users.legacy.actions.js";
import { createUserToken } from "../common/utils/jwtUtils.js";
import { createUserEvent } from "../common/actions/userEvents.actions.js";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../common/constants/userEventsConstants.js";
import { exportAnonymizedEffectifsAsCSV } from "../common/actions/effectifs/effectifs-export.actions.js";
import { Application } from "express-serve-static-core";
import {
  configureOrganismeERP,
  getOrganisationOrganisme,
  inviteUserToOrganisation,
  listOrganisationMembers,
  listOrganisationPendingInvitations,
  removeUserFromOrganisation,
} from "../common/actions/organisations.actions.js";
import { getOrganismeIndicateurs } from "../common/actions/effectifs/effectifs.actions.js";
import { updateUserProfile } from "../common/actions/users.actions.js";

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

  app.use(bodyParser.json());
  app.use(logMiddleware);
  app.use(cookieParser());
  app.use(passport.initialize());

  setupRoutes(app, services);

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  app.use(errorMiddleware());

  return app;
};

function setupRoutes(app: Application, services) {
  /********************************
   * Anonymous routes             *
   ********************************/
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

  app.use("/api/emails", emails(services)); // No versionning to be sure emails links are always working
  app.use("/api/v1/auth", auth());
  app.use("/api/v1/auth", register(services));
  app.use("/api/v1/password", password(services));
  app.get(
    "/api/v1/maintenanceMessages",
    returnResult(async () => {
      return await findMaintenanceMessages();
    })
  );
  app.use("/api/indicateurs-national", indicateursNationalRouter(services));

  /*****************************************************************************
   * Ancien mécanisme de login pour ERP (devrait être supprimé prochainement)  *
   *****************************************************************************/
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

  /*********************************************************
   * API authentifié par clé utilisé pour le réferentiel   *
   *********************************************************/
  app.use(
    "/api/organismes",
    requireApiKeyAuthenticationMiddleware({ apiKeyValue: config.organismesConsultationApiKey }),
    organismesRouter()
  );

  /********************************
   * Authenticated routes         *
   ********************************/
  const authRouter = express.Router();
  authRouter.use(authMiddleware());

  authRouter.get(
    "/api/v1/session/current",
    returnResult(async (req) => {
      return req.user;
    })
  );
  const userProfileUpdateSchema = {
    prenom: Joi.string().default("").allow(""),
    nom: Joi.string().default("").allow(""),
    telephone: Joi.string().default("").allow(""),
    civility: Joi.string().default("").allow(""),
  };
  authRouter.put(
    "/api/v1/profile/user",
    returnResult(async (req) => {
      const infos = await validateFullObjectSchema(req.body, userProfileUpdateSchema);
      await updateUserProfile(req.user, infos);
    })
  );

  authRouter.get(
    "/api/v1/organismes/:id",
    returnResult(async (req) => {
      return await getOrganisme(req.user, req.params.id);
    })
  );
  authRouter.get(
    "/api/v1/organismes/:id/indicateurs",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await getOrganismeIndicateurs(req.user, req.params.id, filters);
    })
  );

  const organismeSearchSchema = {
    searchTerm: Joi.string().min(3),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  };
  authRouter.post(
    "/api/v1/organismes/search",
    returnResult(async (req) => {
      const search = await validateFullObjectSchema<OrganismesSearch>(req.body, organismeSearchSchema);
      return await searchOrganismes(req.user, search);
    })
  );

  authRouter.use("/api/v1/organisme", organisme(services));
  authRouter.use("/api/v1/effectif", effectif());
  authRouter.use("/api/v1/upload", upload(services));
  authRouter.use("/api/v1/server-events", serverEvents());
  authRouter.use("/api/indicateurs", indicateursRouter());
  authRouter.get("/api/v1/indicateurs-export", async (req, res) => {
    const filters = await buildEffectifsFiltersFromRequest(req);
    const csv = await exportAnonymizedEffectifsAsCSV(req.user, filters);
    res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
  });

  /*
   * formations
   */
  const formationsSearchSchema = {
    searchTerm: Joi.string().min(3),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  };
  authRouter.post(
    "/api/formations/search",
    returnResult(async (req) => {
      const formationSearch = await validateFullObjectSchema(req.body, formationsSearchSchema);
      return await searchFormations(formationSearch);
    })
  );

  authRouter.get(
    "/api/formations/:cfd",
    returnResult(async (req) => {
      return await getFormationWithCfd(req.params.cfd);
    })
  );

  /*
   * referentiel
   */
  authRouter.get(
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

  authRouter.get(
    "/api/referentiel/organismes-appartenance",
    returnResult(() => {
      const organismes = Object.keys(ORGANISMES_APPARTENANCE).map((id) => ({ id, nom: ORGANISMES_APPARTENANCE[id] }));
      return organismes;
    })
  );

  authRouter.get(
    "/api/v1/organisation/organismes",
    returnResult(async (req) => {
      return await findUserOrganismes(req.user);
    })
  );
  authRouter.get(
    "/api/v1/organisation/organisme",
    returnResult(async (req) => {
      return await getOrganisationOrganisme(req.user);
    })
  );
  authRouter.post(
    "/api/v1/organisation/configure-erp",
    returnResult(async (req) => {
      return await configureOrganismeERP(req.user, req.body.email.toLowerCase());
    })
  );

  authRouter.get(
    "/api/v1/organisation/membres",
    returnResult(async (req) => {
      return await listOrganisationMembers(req.user);
    })
  );

  authRouter.post(
    "/api/v1/organisation/membres",
    returnResult(async (req) => {
      return await inviteUserToOrganisation(req.user, req.body.email.toLowerCase());
    })
  );

  authRouter.delete(
    "/api/v1/organisation/membres/:userId",
    returnResult(async (req) => {
      return await removeUserFromOrganisation(req.user, req.params.userId);
    })
  );

  authRouter.get(
    "/api/v1/organisation/invitations",
    returnResult(async (req) => {
      return await listOrganisationPendingInvitations(req.user);
    })
  );

  /********************************
   * API droits administrateurs   *
   ********************************/
  const adminRouter = express.Router();
  adminRouter.use(requireAdministrator);
  adminRouter.use("/api/v1/admin", usersAdmin(services));
  adminRouter.use("/api/v1/admin", organismesAdmin());
  adminRouter.use("/api/v1/admin", statsAdmin());
  adminRouter.use("/api/v1/admin/maintenanceMessages", maintenancesAdmin());
  authRouter.use(adminRouter);

  app.use(authRouter);
}
