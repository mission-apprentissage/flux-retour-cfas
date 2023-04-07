import express from "express";
import fs from "fs";
import path from "path";
import passport from "passport";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import Boom from "boom";
import swaggerUi from "swagger-ui-express";

import { apiRoles } from "../common/roles.js";

import { logMiddleware } from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication.js";
import legacyUserPermissionsMiddleware from "./middlewares/legacyUserPermissionsMiddleware.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";

import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes.js";
import organismesRouter from "./routes/specific.routes/organismes.routes.js";
import indicateursRouter, { buildEffectifsFiltersFromRequest } from "./routes/specific.routes/indicateurs.routes.js";
import { serverEventsHandler } from "./routes/specific.routes/server-events.routes.js";

import emails from "./routes/emails.routes.js";

import auth from "./routes/user.routes/auth.routes.js";

import {
  getOrganismeByUAIAvecSousEtablissements,
  getOrganismeEffectifs,
} from "./routes/specific.routes/organisme.routes.js";
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
import { jobEventsDb, usersMigrationDb } from "../common/model/collections.js";
import { packageJson } from "../common/utils/esmUtils.js";
import logger from "../common/logger.js";
import { findMaintenanceMessages } from "../common/actions/maintenances.actions.js";
import {
  findUserOrganismes,
  getOrganisme,
  OrganismesSearch,
  searchOrganismes,
  findOrganismesByUAI,
  findOrganismesBySIRET,
  getOrganismeByUAIAndSIRETOrFallbackAPIEntreprise,
} from "../common/actions/organismes/organismes.actions.js";
import {
  passwordSchema,
  uaiSchema,
  validateFullObjectSchema,
  validateFullZodObjectSchema,
} from "../common/utils/validationUtils.js";
import { getFormationWithCfd, searchFormations } from "../common/actions/formations.actions.js";
import Joi from "joi";
import { authenticateLegacy } from "../common/actions/legacy/users.legacy.actions.js";
import { createUserToken } from "../common/utils/jwtUtils.js";
import { exportAnonymizedEffectifsAsCSV } from "../common/actions/effectifs/effectifs-export.actions.js";
import { Application } from "express-serve-static-core";
import {
  cancelInvitation,
  configureOrganismeERP,
  getInvitationByToken,
  getOrganisationOrganisme,
  inviteUserToOrganisation,
  listOrganisationMembers,
  listOrganisationPendingInvitations,
  rejectMembre,
  removeUserFromOrganisation,
  resendInvitationEmail,
  validateMembre,
} from "../common/actions/organisations.actions.js";
import { getIndicateursNational, getOrganismeIndicateurs } from "../common/actions/effectifs/effectifs.actions.js";
import { changePassword, updateUserProfile } from "../common/actions/users.actions.js";
import { registrationSchema } from "../common/validation/registrationSchema.js";
import { z } from "zod";
import { sendForgotPasswordRequest, register, activateUser } from "../common/actions/account.actions.js";
import { TETE_DE_RESEAUX } from "../common/constants/networksConstants.js";
import { checkActivationToken, checkPasswordToken } from "./helpers/passport-handlers.js";
import validateRequestMiddleware from "./middlewares/validateRequestMiddleware.js";
import loginSchemaLegacy from "../common/validation/loginSchemaLegacy.js";
import { generateSifa } from "../common/actions/sifa.actions/sifa.actions.js";

const openapiSpecs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "./src/http/open-api.json"), "utf8"));

/**
 * Create the express app
 * @returns {Promise<Object>} Express app
 */
export default async () => {
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

  setupRoutes(app);

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  app.use(errorMiddleware());

  return app;
};

function setupRoutes(app: Application) {
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
  app.use("/api/doc", swaggerUi.serve, swaggerUi.setup(openapiSpecs));
  app.post(
    "/api/v1/organismes/search-by-siret",
    returnResult(async (req) => {
      const { siret } = await validateFullObjectSchema(req.body, {
        siret: Joi.string().required(),
      });
      return await findOrganismesBySIRET(siret);
    })
  );
  app.post(
    "/api/v1/organismes/search-by-uai",
    returnResult(async (req) => {
      const { uai } = await validateFullObjectSchema(req.body, {
        uai: Joi.string().required().uppercase(),
      });
      return await findOrganismesByUAI(uai);
    })
  );
  app.post(
    "/api/v1/organismes/get-by-uai-siret",
    returnResult(async (req) => {
      const { uai, siret } = await validateFullZodObjectSchema(req.body, {
        uai: z.string().nullable(),
        siret: z.string(),
      });
      return await getOrganismeByUAIAndSIRETOrFallbackAPIEntreprise(uai, siret);
    })
  );

  app.use("/api/emails", emails()); // No versionning to be sure emails links are always working
  app.use("/api/v1/auth", auth());

  app.post(
    "/api/v1/auth/register",
    returnResult(async (req) => {
      const registration = await validateFullZodObjectSchema(req.body, registrationSchema);
      registration.user.email = registration.user.email.toLowerCase();
      return await register(registration);
    })
  );
  app.post(
    "/api/v1/auth/activation",
    // l'utilisateur est authentifié par JWT envoyé par email
    checkActivationToken(),
    returnResult(async (req) => {
      // tant que l'utilisateur n'est pas confirmé
      if (req.user.account_status === "PENDING_EMAIL_VALIDATION") {
        await activateUser(req.user.email);
      }
      // renvoi du statut du compte pour rediriger l'utilisateur si son statut change
      return await usersMigrationDb().findOne(
        { email: req.user.email },
        {
          projection: {
            _id: 0,
            account_status: 1,
          },
        }
      );
    })
  );
  app.post(
    "/api/v1/password/forgotten-password",
    returnResult(async (req) => {
      const { email } = await validateFullObjectSchema(req.body, {
        email: Joi.string().email().required().lowercase().trim(),
      });
      await sendForgotPasswordRequest(email);
    })
  );
  app.post(
    "/api/v1/password/reset-password",
    // l'utilisateur est authentifié par JWT envoyé par email
    checkPasswordToken(),
    returnResult(async (req) => {
      // TODO ISSUE! DO NOT DISPLAY PASSWORD IN SERVER LOG
      const { password } = await validateFullObjectSchema(req.body, {
        passwordToken: Joi.string().required(),
        password: passwordSchema(req.user.organisation.type === "ADMINISTRATEUR").required(),
      });
      await changePassword(req.user, password);
    })
  );
  app.get(
    "/api/v1/maintenanceMessages",
    returnResult(async () => {
      return await findMaintenanceMessages();
    })
  );
  app.use(
    "/api/indicateurs-national",
    returnResult(async (req) => {
      const { date } = await validateFullObjectSchema(req.query, {
        date: Joi.date().required(),
      });
      return await getIndicateursNational(date);
    })
  );

  app.get(
    "/api/v1/invitations/:token",
    returnResult(async (req) => {
      return await getInvitationByToken(req.params.token);
    })
  );

  /*****************************************************************************
   * Ancien mécanisme de login pour ERP (devrait être supprimé prochainement)  *
   *****************************************************************************/
  app.post(
    "/api/login",
    validateRequestMiddleware({
      body: loginSchemaLegacy.strict(),
    }),
    returnResult(async (req) => {
      const { username, password } = req.body;
      const authenticatedUser = await authenticateLegacy(username, password);
      if (!authenticatedUser) {
        throw Boom.unauthorized();
      }
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
    "/api/v1/session",
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

  const userCGUUpdateSchema = {
    has_accept_cgu_version: Joi.string().required(),
  };
  authRouter.put(
    "/api/v1/profile/cgu",
    returnResult(async (req) => {
      const infos = await validateFullObjectSchema(req.body, userCGUUpdateSchema);
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
  authRouter.get(
    "/api/v1/organismes/:id/effectifs",
    returnResult(async (req) => {
      return await getOrganismeEffectifs(req.user, req.params.id, req.query.sifa === "true");
    })
  );
  authRouter.get(
    "/api/v1/organismes/:id/sifa-export",
    returnResult(async (req, res) => {
      const sifaCsv = await generateSifa(req.user, req.params.id);
      res.attachment(`tdb-données-sifa-${req.query.organismeId}.csv`);
      return sifaCsv;
    })
  );
  // LEGACY écrans indicateurs
  authRouter.get(
    "/api/v1/organisme/:uai", // FIXME SECURITE openbar pour la recherche
    returnResult(async (req) => {
      const { uai } = await validateFullObjectSchema(req.params, {
        uai: uaiSchema(),
      });
      return await getOrganismeByUAIAvecSousEtablissements(uai);
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

  authRouter.use("/api/v1/effectif", effectif());
  authRouter.use("/api/v1/upload", upload());
  authRouter.get("/api/v1/server-events", serverEventsHandler);
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
      return TETE_DE_RESEAUX.filter((reseau) => !RESEAUX_CFAS_INVALID.includes(reseau.key)).map((reseau) => ({
        id: reseau.key,
        nom: reseau.nom,
      }));
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
      await configureOrganismeERP(req.user, req.body);
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
      await inviteUserToOrganisation(req.user, req.body.email.toLowerCase());
    })
  );

  authRouter.delete(
    "/api/v1/organisation/membres/:userId",
    returnResult(async (req) => {
      await removeUserFromOrganisation(req.user, req.params.userId);
    })
  );

  authRouter.post(
    "/api/v1/organisation/membres/:userId/validate",
    returnResult(async (req) => {
      await validateMembre(req.user, req.params.userId);
    })
  );

  authRouter.post(
    "/api/v1/organisation/membres/:userId/reject",
    returnResult(async (req) => {
      await rejectMembre(req.user, req.params.userId);
    })
  );

  authRouter.get(
    "/api/v1/organisation/invitations",
    returnResult(async (req) => {
      return await listOrganisationPendingInvitations(req.user);
    })
  );

  authRouter.delete(
    "/api/v1/organisation/invitations/:invitationId",
    returnResult(async (req) => {
      await cancelInvitation(req.user, req.params.invitationId);
    })
  );

  authRouter.post(
    "/api/v1/organisation/invitations/:invitationId/resend",
    returnResult(async (req) => {
      await resendInvitationEmail(req.user, req.params.invitationId);
    })
  );

  /********************************
   * API droits administrateurs   *
   ********************************/
  const adminRouter = express.Router();
  adminRouter.use(requireAdministrator);
  adminRouter.use("/api/v1/admin", usersAdmin());
  adminRouter.use("/api/v1/admin", organismesAdmin());
  adminRouter.use("/api/v1/admin", statsAdmin());
  adminRouter.use("/api/v1/admin/maintenanceMessages", maintenancesAdmin());
  authRouter.use(adminRouter);

  app.use(authRouter);
}
