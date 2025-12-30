// catch all unhandled promise rejections and call the error middleware
import "express-async-errors";

import fs from "fs";

import * as Sentry from "@sentry/node";
import { zUai } from "api-alternance-sdk/internal";
import bodyParser from "body-parser";
import Boom from "boom";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import Joi from "joi";
import { ObjectId } from "mongodb";
import passport from "passport";
import {
  CODE_POSTAL_REGEX,
  SOURCE_APPRENANT,
  typesEffectifNominatif,
  typesOrganismesIndicateurs,
  zEffectifArchive,
} from "shared";
import {
  computeWarningsForDossierApprenantSchemaV3,
  dossierApprenantSchemaV3WithMoreRequiredFieldsValidatingUAISiret,
} from "shared/models/parts/dossierApprenantSchemaV3";
import { extensions, primitivesV1 } from "shared/models/parts/zodPrimitives";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

import {
  activateUser,
  login,
  register,
  registerUnknownNetwork,
  sendForgotPasswordRequest,
} from "@/common/actions/account.actions";
import { getEffectifForm, softDeleteEffectif, updateEffectifFromForm } from "@/common/actions/effectifs.actions";
import {
  deleteOldestDuplicates,
  getDuplicatesEffectifsForOrganismeIdWithPagination,
} from "@/common/actions/effectifs.duplicates.actions";
import {
  dateFiltersSchema,
  effectifsFiltersTerritoireSchema,
  fullEffectifsFiltersSchema,
} from "@/common/actions/helpers/filters";
import { getIndicateursNational } from "@/common/actions/indicateurs/indicateurs-national.actions";
import {
  getEffectifsNominatifsWithoutId,
  getIndicateursEffectifsParDepartement,
  getIndicateursEffectifsParOrganisme,
  getOrganismeIndicateursEffectifs,
  getOrganismeIndicateursEffectifsParFormation,
} from "@/common/actions/indicateurs/indicateurs-with-deca.actions";
import {
  getIndicateursForRelatedOrganismes,
  getIndicateursOrganismesParDepartement,
  getOrganismeIndicateursOrganismes,
} from "@/common/actions/indicateurs/indicateurs.actions";
import { findDataFromSiret } from "@/common/actions/infoSiret.actions";
import { findMaintenanceMessages } from "@/common/actions/maintenances.actions";
import {
  cancelInvitation,
  createOrganisation,
  getInvitationByToken,
  getOrganisationOrganisme,
  inviteUserToOrganisation,
  listOrganisationMembers,
  listOrganisationPendingInvitations,
  rejectInvitation,
  rejectMembre,
  removeUserFromOrganisation,
  resendInvitationEmail,
  validateMembre,
} from "@/common/actions/organisations.actions";
import {
  configureOrganismeERP,
  findOrganismesBySIRET,
  findOrganismesByUAI,
  generateApiKeyForOrg,
  getInvalidSiretsFromDossierApprenant,
  getInvalidUaisFromDossierApprenant,
  getOrganisationIndicateursForRelatedOrganismes,
  getOrganisationIndicateursOrganismes,
  getOrganismeByAPIKey,
  getOrganismeById,
  getOrganismeByUAIAndSIRET,
  getOrganismeDetails,
  getStatOrganismes,
  listContactsOrganisme,
  listOrganisationOrganismes,
  listOrganismesFormateurs,
  resetConfigurationERP,
  verifyOrganismeAPIKeyToUser,
} from "@/common/actions/organismes/organismes.actions";
import {
  getDuplicatesOrganismes,
  mergeOrganismeSansUaiDansOrganismeFiable,
} from "@/common/actions/organismes/organismes.duplicates.actions";
import { searchOrganismesFormations } from "@/common/actions/organismes/organismes.formations.actions";
import { createSession, removeSession } from "@/common/actions/sessions.actions";
import { generateSifa } from "@/common/actions/sifa.actions/sifa.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import { changePassword, updateUserProfile } from "@/common/actions/users.actions";
import { getCfdInfo, getCommune, getRncpInfo } from "@/common/apis/apiAlternance/apiAlternance";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import logger from "@/common/logger";
import { effectifsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { initSentryExpress } from "@/common/services/sentry/sentry";
import { __dirname } from "@/common/utils/esmUtils";
import { responseWithCookie } from "@/common/utils/httpUtils";
import { stripEmptyFields } from "@/common/utils/miscUtils";
import stripNullProperties from "@/common/utils/stripNullProperties";
import { passwordSchema, validateFullObjectSchema, validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { SReqPostVerifyUser } from "@/common/validation/ApiERPSchema";
import { configurationERPSchema } from "@/common/validation/configurationERPSchema";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { registrationSchema, registrationUnknownNetworkSchema } from "@/common/validation/registrationSchema";
import userProfileSchema from "@/common/validation/userProfileSchema";
import config from "@/config";

import { authMiddleware, checkActivationToken, checkPasswordToken } from "./helpers/passport-handlers";
import errorMiddleware from "./middlewares/errorMiddleware";
import {
  blockDREETSDDETS,
  requireAdministrator,
  requireEffectifOrganismePermission,
  requireMissionLocale,
  requireARML,
  requireOrganismePermission,
  returnResult,
  requireFranceTravail,
  requireIndicateursMlAccess,
} from "./middlewares/helpers";
import { logMiddleware } from "./middlewares/logMiddleware";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication";
import requireBearerAuthentication from "./middlewares/requireBearerAuthentication";
import validateRequestMiddleware from "./middlewares/validateRequestMiddleware";
import { openApiFilePath } from "./open-api-path";
import affelnetRoutesAdmin from "./routes/admin.routes/affelnet.routes";
import effectifsAdmin from "./routes/admin.routes/effectifs.routes";
import erpsRoutesAdmin from "./routes/admin.routes/erps.routes";
import maintenancesAdmin from "./routes/admin.routes/maintenances.routes";
import missionLocaleRoutesAdmin from "./routes/admin.routes/mission-locale.routes";
import opcosRoutesAdmin from "./routes/admin.routes/opcos.routes";
import organismesAdmin from "./routes/admin.routes/organismes.routes";
import reseauxAdmin from "./routes/admin.routes/reseaux.routes";
import transmissionRoutesAdmin from "./routes/admin.routes/transmissions.routes";
import usersAdmin from "./routes/admin.routes/users.routes";
import campagneRouter from "./routes/campagne.routes/campagne.routes";
import emails from "./routes/emails.routes";
import armlAuthentRoutes from "./routes/organisations.routes/arml/arml.routes";
import franceTravailAuthentRoutes from "./routes/organisations.routes/france-travail/france-travail.routes";
import indicateursMlRoutes from "./routes/organisations.routes/indicateurs-ml/indicateurs-ml.routes";
import missionLocaleAuthentRoutes from "./routes/organisations.routes/mission-locale/mission-locale.routes";
import effectifsOrganismeRoutes from "./routes/organismes.routes/effectifs.routes";
import missionLocaleOrganismeRoutes from "./routes/organismes.routes/mission-locale.routes";
import franceTravailPublicRoutes from "./routes/public.routes/france-travail.routes";
import missionLocalePublicRoutes from "./routes/public.routes/mission-locale.routes";
import getAllReseauxRoutes from "./routes/public.routes/reseaux.routes";
import affelnetRoutes from "./routes/specific.routes/affelnet.routes";
import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes";
import erpRoutes from "./routes/specific.routes/erps.routes";
import organismesRouter from "./routes/specific.routes/organismes.routes";
import transmissionRoutes from "./routes/specific.routes/transmission.routes";

const openapiSpecs = JSON.parse(fs.readFileSync(openApiFilePath, "utf8"));

/**
 * Create the express app
 */
export default async function createServer(): Promise<Application> {
  const app = express();

  // Configure Sentry
  initSentryExpress(app);

  if (config.env !== "test") {
    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
  }

  if (config.env === "local" || config.env === "test") {
    app.use(cors({ credentials: true, origin: config.publicUrl }));
  }

  app.use(bodyParser.json({ limit: config.bodyParserLimit }));
  app.use(logMiddleware);
  app.use(cookieParser());
  app.use(passport.initialize());

  setupRoutes(app);

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  app.use(errorMiddleware());

  return app;
}

function setupRoutes(app: Application) {
  /********************************
   * Anonymous routes             *
   ********************************/
  app
    .get(
      "/api",
      returnResult(async () => {
        return {
          name: "TDB Apprentissage API",
          version: config.version,
          env: config.env,
        };
      })
    )
    .get(
      "/api/healthcheck",
      returnResult(async () => {
        let mongodbHealthy = false;
        try {
          await usersMigrationDb().findOne({});
          mongodbHealthy = true;
        } catch (err) {
          logger.error({ err }, "healthcheck failed");
          Sentry.captureException(new Error("healthcheck failed", { cause: err }));
        }

        return {
          name: "TDB Apprentissage API",
          version: config.version,
          env: config.env,
          healthcheck: {
            mongodb: mongodbHealthy,
          },
        };
      })
    )
    .post(
      "/api/v1/organismes/search-by-siret",
      returnResult(async (req) => {
        const { siret } = await validateFullZodObjectSchema(req.body, {
          siret: primitivesV1.etablissement_formateur.siret,
        });
        return await findOrganismesBySIRET(siret);
      })
    )
    .post(
      "/api/v1/organismes/search-by-uai",
      returnResult(async (req) => {
        const { uai } = await validateFullObjectSchema(req.body, {
          uai: Joi.string().required().uppercase(),
        });
        return await findOrganismesByUAI(uai);
      })
    )
    .post(
      "/api/v1/organismes/get-by-uai-siret",
      returnResult(async (req) => {
        const { uai, siret } = await validateFullZodObjectSchema(req.body, {
          uai: z.string().nullable(),
          siret: z.string(),
        });
        const organisme = await getOrganismeByUAIAndSIRET(uai, siret);
        if (!organisme) {
          throw Boom.badRequest("Aucun organisme trouvé");
        }
        return organisme;
      })
    )
    .use("/api/emails", emails()) // No versionning to be sure emails links are always working
    .use(
      "/api/doc",
      swaggerUi.serve,
      swaggerUi.setup(openapiSpecs, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "API Mission Apprentissage",
      })
    )
    .use("/api/openapi-model", (req, res) => res.download(openApiFilePath))
    .post(
      "/api/v1/auth/login",
      returnResult(async (req, res) => {
        const { email, password } = await validateFullZodObjectSchema(req.body, {
          email: z.string().email().toLowerCase(),
          password: z.string(),
        });
        const sessionToken = await login(email, password);
        responseWithCookie(res, sessionToken);
      })
    )
    .post(
      "/api/v1/auth/logout",
      returnResult(async (req, res) => {
        if (!req.cookies[COOKIE_NAME]) {
          throw Boom.unauthorized("invalid jwt");
        }
        await removeSession(req.cookies[COOKIE_NAME]);
        res.clearCookie(COOKIE_NAME);
      })
    )
    .post(
      "/api/v1/auth/register",
      returnResult(async (req) => {
        const registration = await validateFullZodObjectSchema(req.body, registrationSchema);
        registration.user.email = registration.user.email.toLowerCase();
        return await register(registration);
      })
    )
    .post(
      "/api/v1/auth/register-unknown-network",
      returnResult(async (req) => {
        const registrationUnknownNetwork = await validateFullZodObjectSchema(
          req.body,
          registrationUnknownNetworkSchema
        );
        registrationUnknownNetwork.email = registrationUnknownNetwork.email.toLowerCase();
        await registerUnknownNetwork(registrationUnknownNetwork);
      })
    )
    .post(
      "/api/v1/auth/activation",
      // l'utilisateur est authentifié par JWT envoyé par email
      checkActivationToken(),
      returnResult(async (req) => {
        return await activateUser(req.user);
      })
    )
    .post(
      "/api/v1/password/forgotten-password",
      returnResult(async (req) => {
        const { email } = await validateFullZodObjectSchema(req.body, {
          email: z.string().email().toLowerCase().trim(),
        });

        await sendForgotPasswordRequest(email);
      })
    )
    .post(
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
    )
    .get(
      "/api/v1/maintenanceMessages",
      returnResult(async () => {
        return await findMaintenanceMessages();
      })
    )
    .get(
      "/api/v1/indicateurs/national",
      returnResult(async (req) => {
        const filters = await validateFullZodObjectSchema(req.query, effectifsFiltersTerritoireSchema);
        return await getIndicateursNational(filters);
      })
    )
    .get(
      "/api/v1/invitations/:token",
      returnResult(async (req) => {
        return await getInvitationByToken(req.params.token);
      })
    )
    .post(
      "/api/v1/invitations/:token/reject",
      returnResult(async (req) => {
        await rejectInvitation(req.params.token);
      })
    )
    .use("/api/v1/reseaux", getAllReseauxRoutes())
    .use("/api/v1/mission-locale", missionLocalePublicRoutes())
    .use("/api/v1/france-travail", franceTravailPublicRoutes());

  app.use(
    ["/api/v3/dossiers-apprenants"],
    requireBearerAuthentication(),
    async (req, res, next) => {
      try {
        const organisme = await getOrganismeByAPIKey(res.locals.token, req.query);

        (req.user as any) = {
          source: SOURCE_APPRENANT.ERP,
          source_organisme_id: organisme._id.toString(),
        };

        Sentry.setUser({
          segment: "bearer",
          ip_address: req.ip,
          id: `organisme-${organisme._id.toString()}`,
          username: `organisme: ${organisme.siret} / ${organisme.uai}`,
        });
        next();
      } catch (err) {
        next(err);
      }
    },
    dossierApprenantRouter()
  );

  /*********************************************************
   * API authentifié par clé utilisé pour le réferentiel   *
   *********************************************************/
  app.use(
    "/api/organismes",
    requireApiKeyAuthenticationMiddleware({
      apiKeyValue: config.organismesConsultationApiKey,
    }),
    organismesRouter()
  );

  /********************************
   * Authenticated routes         *
   ********************************/
  const authRouter = express.Router();
  authRouter
    .use(authMiddleware())
    .get(
      "/api/v1/session",
      returnResult(async (req) => {
        return req.user;
      })
    )
    .put(
      "/api/v1/profile/user",
      validateRequestMiddleware({ body: userProfileSchema().strict() }),
      returnResult(async (req) => {
        await updateUserProfile(req.user, req.body);
      })
    )
    .put(
      "/api/v1/profile/cgu/accept/:version",
      returnResult(async (req) => {
        await updateUserProfile(req.user, {
          has_accept_cgu_version: req.params.version,
        });
      })
    )
    .use("/api/v1/erps", erpRoutes());

  /********************************
   * API pour un organisme   *
   ********************************/
  authRouter.use(
    "/api/v1/organismes/:id",
    validateRequestMiddleware({ params: objectIdSchema("id") }),
    (req, res, next) => {
      res.locals.organismeId = new ObjectId((req.params as any).id);
      next();
    },
    express
      .Router()
      .get(
        "",
        returnResult(async (req, res) => {
          return await getOrganismeDetails(req.user, res.locals.organismeId);
        })
      )
      .get(
        "/indicateurs/effectifs",
        requireOrganismePermission("indicateursEffectifs"),
        returnResult(async (req, res) => {
          const filters = await validateFullZodObjectSchema(req.query, effectifsFiltersTerritoireSchema);
          return await getOrganismeIndicateursEffectifs(req.user, res.locals.organismeId, filters);
        })
      )
      .get(
        "/indicateurs/effectifs/par-organisme",
        requireOrganismePermission("indicateursEffectifs"),
        returnResult(async (req, res) => {
          const filters = await validateFullZodObjectSchema(req.query, fullEffectifsFiltersSchema);
          return await getIndicateursEffectifsParOrganisme(req.user, filters, res.locals.organismeId);
        })
      )
      .get(
        "/indicateurs/effectifs/par-formation",
        requireOrganismePermission("indicateursEffectifs"),
        returnResult(async (req, res) => {
          const filters = await validateFullZodObjectSchema(req.query, fullEffectifsFiltersSchema);
          return await getOrganismeIndicateursEffectifsParFormation(req.user, res.locals.organismeId, filters);
        })
      )
      .get(
        "/indicateurs/effectifs/:type",
        requireOrganismePermission("effectifsNominatifs"),
        returnResult(async (req, res) => {
          const filters = await validateFullZodObjectSchema(req.query, fullEffectifsFiltersSchema);
          const type = await z.enum(typesEffectifNominatif).parseAsync(req.params.type);
          const { effectifsWithoutIds, ids } = await getEffectifsNominatifsWithoutId(
            req.user,
            filters,
            type,
            res.locals.organismeId
          );
          await createTelechargementListeNomLog(
            type,
            ids.map((id) => id.toString()),
            new Date(),
            req.user._id,
            res.locals.organismeId
          );
          return effectifsWithoutIds;
        })
      )
      .get(
        "/indicateurs/organismes",
        blockDREETSDDETS,
        returnResult(async (req, res) => {
          return await getOrganismeIndicateursOrganismes(res.locals.organismeId);
        })
      )
      .get(
        "/indicateurs/organismes/:type",
        blockDREETSDDETS,
        returnResult(async (req, res) => {
          const indicateurs = await getIndicateursForRelatedOrganismes(res.locals.organismeId, req.params.type);
          const type = await z.enum(typesOrganismesIndicateurs).parseAsync(req.params.type);
          await createTelechargementListeNomLog(
            `organismes_${type}`,
            indicateurs.map(({ _id }) => (_id ? _id.toString() : "")),
            new Date(),
            req.user._id,
            res.locals.organismeId
          );
          return indicateurs;
        })
      )
      .get(
        "/contacts",
        requireOrganismePermission("viewContacts"),
        returnResult(async (req, res) => {
          return await listContactsOrganisme(res.locals.organismeId);
        })
      )
      .get(
        "/organismes",
        returnResult(async (req, res) => {
          return await listOrganismesFormateurs(req.user, res.locals.organismeId);
        })
      )
      .get(
        "/duplicates",
        requireOrganismePermission("manageEffectifs"),
        returnResult(async (req, res) => {
          const page = parseInt(req.query.page, 10) || 1;
          const limit = parseInt(req.query.limit, 10) || 5;

          let duplicates = await getDuplicatesEffectifsForOrganismeIdWithPagination(
            res.locals.organismeId,
            page,
            limit
          );

          return duplicates;
        })
      )
      .delete(
        "/duplicates",
        requireOrganismePermission("manageEffectifs"),
        returnResult(async (req, res) => {
          await deleteOldestDuplicates(res.locals.organismeId);
        })
      )
      .get(
        "/sifa-export",
        requireOrganismePermission("manageEffectifs"),
        returnResult(async (req, res) => {
          const organismeId = res.locals.organismeId;
          const organisme = await getOrganismeById(organismeId);
          const filters = await validateFullZodObjectSchema(req.query, { type: z.enum(["csv", "xlsx"]) });

          const { file, effectifsIds, extension } = await generateSifa(organismeId as any as ObjectId, filters.type);
          res.attachment(
            `tdb-donnees-sifa-${organisme.enseigne ?? organisme.raison_sociale ?? "Organisme inconnu"}-${new Date().toISOString().split("T")[0]}.${extension}`
          );

          await createTelechargementListeNomLog("sifa", effectifsIds, new Date(), req.user?._id, organismeId);
          return file;
        })
      )
      .put(
        "/configure-erp",
        requireOrganismePermission("configurerModeTransmission"),
        returnResult(async (req, res) => {
          const conf = await validateFullZodObjectSchema(req.body, configurationERPSchema);
          await configureOrganismeERP(req.user, res.locals.organismeId, conf);
        })
      )
      .delete(
        "/configure-erp",
        requireOrganismePermission("configurerModeTransmission"),
        returnResult(async (req, res) => {
          await resetConfigurationERP(res.locals.organismeId);
        })
      )
      .post(
        "/verify-user",
        requireOrganismePermission("configurerModeTransmission"),
        returnResult(async (req, res) => {
          // POST /api/v1/organismes/:id/verify-user { siret=XXXXX, uai=YYYYY, erp=ZZZZ , api_key=TTTTT }
          const verif = await validateFullZodObjectSchema(req.body, SReqPostVerifyUser);
          await verifyOrganismeAPIKeyToUser(res.locals.organismeId, verif);
        })
      )
      .use(
        "/upload",
        requireOrganismePermission("manageEffectifs"),
        express
          .Router()
          .post(
            "/validate",
            returnResult(async (req) => {
              const data = await z
                .array(
                  dossierApprenantSchemaV3WithMoreRequiredFieldsValidatingUAISiret(
                    await getInvalidUaisFromDossierApprenant(Array.isArray(req.body) ? req.body : []),
                    await getInvalidSiretsFromDossierApprenant(Array.isArray(req.body) ? req.body : [])
                  )
                )
                .safeParseAsync(
                  Array.isArray(req.body) ? req.body.map((dossier) => stripNullProperties(dossier)) : req.body
                );
              const warnings = computeWarningsForDossierApprenantSchemaV3(req.body);
              return { ...data, warnings };
            })
          )
          .use(
            // v3 is required in URL to consider the request as a v3 import
            "/import/v3",
            async (req, res, next) => {
              req.user.source = SOURCE_APPRENANT.FICHIER;
              req.user.source_organisme_id = String(res.locals.organismeId);
              next();
            },
            dossierApprenantRouter()
          )
      )
      .use(
        "/api-key",
        requireOrganismePermission("manageEffectifs"),
        express
          .Router()
          .get(
            "/",
            returnResult(async (req, res) => {
              const organisme = await getOrganismeById(res.locals.organismeId);
              return { apiKey: organisme.api_key };
            })
          )
          .post(
            "/",
            returnResult(async (req, res) => {
              const generatedApiKey = await generateApiKeyForOrg(res.locals.organismeId);
              return { apiKey: generatedApiKey };
            })
          )
      )
      .use("/transmission", transmissionRoutes())
      .use("/effectifs", effectifsOrganismeRoutes())
      .use("/mission-locale", requireOrganismePermission("manageEffectifs"), missionLocaleOrganismeRoutes())
  );

  /********************************
   * Indicateurs aggrégés         *
   ********************************/
  authRouter
    .get(
      "/api/v1/indicateurs/effectifs/par-departement",
      returnResult(async (req) => {
        const filters = await validateFullZodObjectSchema(req.query, dateFiltersSchema);
        return await getIndicateursEffectifsParDepartement(filters, req.user.acl);
      })
    )
    .get(
      "/api/v1/indicateurs/effectifs/par-organisme",
      returnResult(async (req) => {
        const filters = await validateFullZodObjectSchema(req.query, fullEffectifsFiltersSchema);
        return await getIndicateursEffectifsParOrganisme(req.user, filters);
      })
    )
    .get(
      "/api/v1/indicateurs/effectifs/:type",
      returnResult(async (req) => {
        const filters = await validateFullZodObjectSchema(req.query, fullEffectifsFiltersSchema);
        const type = await z.enum(typesEffectifNominatif).parseAsync(req.params.type);
        const permissions = req.user.acl.effectifsNominatifs[type];
        if (permissions === false) {
          throw Boom.forbidden("Permissions invalides");
        }

        const { effectifsWithoutIds, ids } = await getEffectifsNominatifsWithoutId(req.user, filters, type);
        await createTelechargementListeNomLog(
          type,
          ids.map((id) => id.toString()),
          new Date(),
          req.user._id,
          undefined,
          new ObjectId(req.user.organisation_id)
        );
        return effectifsWithoutIds;
      })
    )
    .get(
      "/api/v1/indicateurs/organismes/par-departement",
      returnResult(async (req) => {
        const filters = await validateFullZodObjectSchema(req.query, dateFiltersSchema);
        return await getIndicateursOrganismesParDepartement(filters, req.user.acl);
      })
    )
    .post(
      "/api/v1/formations/search",
      returnResult(async (req) => {
        const { searchTerm } = await validateFullZodObjectSchema(req.body, {
          searchTerm: z.string().min(3),
        });
        return await searchOrganismesFormations(searchTerm);
      })
    );

  authRouter.get(
    "/api/v1/rncp/:code_rncp",
    returnResult(async (req) => {
      return await getRncpInfo(req.params.code_rncp);
    })
  );

  authRouter.get(
    "/api/v1/cfd/:cfd_code",
    returnResult(async (req) => {
      return await getCfdInfo(req.params.cfd_code);
    })
  );

  authRouter
    .post(
      "/api/v1/effectif/recherche-siret",
      returnResult(async (req) => {
        const { siret } = await validateFullZodObjectSchema(req.body, {
          siret: extensions.siret(),
        });

        return await findDataFromSiret(siret);
      })
    )
    .post(
      "/api/v1/effectif/recherche-uai",
      returnResult(async (req) => {
        const { uai } = await validateFullZodObjectSchema(req.body, {
          uai: extensions.uai(),
        });

        return stripEmptyFields({
          uai,
          error: zUai.safeParse(uai).success ? null : `L'UAI ${uai} n'est pas valide`,
        });
      })
    )
    .post(
      "/api/v1/effectif/recherche-code-postal",
      returnResult(async (req) => {
        const { codePostal } = await validateFullZodObjectSchema(req.body, {
          codePostal: z
            .string()
            .trim()
            .regex(CODE_POSTAL_REGEX, "Le code postal doit faire 5 caractères numériques exactement"),
        });
        return await getCommune({ codePostal });
      })
    )
    .get(
      "/api/v1/effectif/:id",
      requireEffectifOrganismePermission("manageEffectifs"),
      returnResult(async (req) => {
        return await getEffectifForm(new ObjectId(req.params.id));
      })
    )
    .put(
      "/api/v1/effectif/:id",
      requireEffectifOrganismePermission("manageEffectifs"),
      returnResult(async (req) => {
        return await updateEffectifFromForm(new ObjectId(req.params.id), req.body);
      })
    )
    .post(
      "/api/v1/effectif/:id/delete",
      requireEffectifOrganismePermission("manageEffectifs"),
      returnResult(async (req) => {
        const { motif, description } = await validateFullZodObjectSchema(req.body, {
          motif: zEffectifArchive.shape.suppression.shape.motif,
          description: zEffectifArchive.shape.suppression.shape.description,
        });

        await softDeleteEffectif(req.params.id, req.user._id, { motif, description });
      })
    )
    .delete(
      "/api/v1/effectif/:id",
      requireEffectifOrganismePermission("manageEffectifs"),
      returnResult(async (req) => {
        await effectifsDb().deleteOne({ _id: new ObjectId(req.params.id) });
      })
    );

  /********************************
   * API organisation   *
   ********************************/
  authRouter.use(
    "/api/v1/organisation",
    express
      .Router()
      .get(
        "/organismes",
        returnResult(async (req) => {
          return await listOrganisationOrganismes(req.user.acl);
        })
      )
      .get(
        "/organismes/indicateurs",
        returnResult(async (req) => {
          return await getOrganisationIndicateursOrganismes(req.user.acl);
        })
      )
      .get(
        "/organismes/indicateurs/:type",
        returnResult(async (req, res) => {
          const indicateurs = await getOrganisationIndicateursForRelatedOrganismes(req.user.acl, req.params.type);
          const type = await z.enum(typesOrganismesIndicateurs).parseAsync(req.params.type);
          await createTelechargementListeNomLog(
            `organismes_${type}`,
            indicateurs.map(({ _id }) => (_id ? _id.toString() : "")),
            new Date(),
            req.user._id,
            res.locals.organismeId
          );
          return indicateurs;
        })
      )
      .get(
        "/organisme",
        returnResult(async (req) => {
          return await getOrganisationOrganisme(req.user);
        })
      )
      .get(
        "/membres",
        returnResult(async (req) => {
          return await listOrganisationMembers(req.user);
        })
      )
      .post(
        "/membres",
        returnResult(async (req) => {
          await inviteUserToOrganisation(
            req.user,
            req.body.email.toLowerCase(),
            (req.user as AuthContext).organisation_id
          );
        })
      )
      .delete(
        "/membres/:userId",
        returnResult(async (req) => {
          await removeUserFromOrganisation(req.user, req.params.userId);
        })
      )
      .post(
        "/membres/:userId/validate",
        returnResult(async (req) => {
          await validateMembre(req.user, req.params.userId);
        })
      )
      .post(
        "/membres/:userId/reject",
        returnResult(async (req) => {
          await rejectMembre(req.user, req.params.userId);
        })
      )
      .get(
        "/invitations",
        returnResult(async (req) => {
          return await listOrganisationPendingInvitations(req.user);
        })
      )
      .delete(
        "/invitations/:invitationId",
        returnResult(async (req) => {
          await cancelInvitation(req.user, req.params.invitationId);
        })
      )
      .post(
        "/invitations/:invitationId/resend",
        returnResult(async (req) => {
          await resendInvitationEmail(req.user, req.params.invitationId);
        })
      )
      .use("/mission-locale", requireMissionLocale, missionLocaleAuthentRoutes())
      .use("/arml", requireARML, armlAuthentRoutes())
      .use("/france-travail", requireFranceTravail, franceTravailAuthentRoutes())
      .use("/indicateurs-ml", requireIndicateursMlAccess, indicateursMlRoutes())
  );

  /********************************
   * API droits administrateurs   *
   ********************************/

  authRouter.delete(
    "/api/v1/admin/impersonate",
    returnResult(async (req, res) => {
      if (!req.user.impersonating) {
        throw Boom.forbidden("Permissions invalides");
      }
      // génère une session classique pour retrouver les permissions admin
      const sessionToken = await createSession(req.user.email);
      responseWithCookie(res, sessionToken);
    })
  );

  authRouter.use("/api/v1/affelnet", affelnetRoutes());
  authRouter.use(
    "/api/v1/admin",
    express
      .Router()
      .use(requireAdministrator)
      .use("/users", usersAdmin())
      .use("/organismes", organismesAdmin())
      .use("/reseaux", reseauxAdmin())
      .use("/effectifs", effectifsAdmin())
      .use("/transmissions", transmissionRoutesAdmin())
      .use("/affelnet", affelnetRoutesAdmin())
      .use("/opcos", opcosRoutesAdmin())
      .use("/erps", erpsRoutesAdmin())
      .use("/mission-locale", missionLocaleRoutesAdmin())
      .get(
        "/stats",
        returnResult(async () => {
          return await getStatOrganismes();
        })
      )
      .use("/maintenanceMessages", maintenancesAdmin())
      .post(
        "/impersonate",
        returnResult(async (req, res) => {
          const organisationBody = await registrationSchema.organisation.parseAsync(req.body);
          let organisation = await organisationsDb().findOne(organisationBody);
          if (!organisation) {
            await createOrganisation(organisationBody);
            organisation = await organisationsDb().findOne(organisationBody);
          }

          let sessionToken;
          if (organisation?.type === "ORGANISME_FORMATION") {
            const userOrganisme = await organismesDb().findOne({
              siret: organisation.siret,
              uai: organisation.uai as string,
            });

            if (userOrganisme) {
              sessionToken = await createSession(req.user.email, {
                impersonatedOrganisation: { ...organisation, organisme_id: userOrganisme._id },
              });
            } else {
              throw new Error("Organisme non trouvé.");
            }
          } else {
            sessionToken = await createSession(req.user.email, {
              impersonatedOrganisation: organisation,
            });
          }

          responseWithCookie(res, sessionToken);
        })
      )
      .get(
        "/organismes-duplicates",
        returnResult(async () => {
          return await getDuplicatesOrganismes();
        })
      )
      .post(
        "/fusion-organismes",
        returnResult(async (req) => {
          const { organismeFiableId, organismeSansUaiId } = req.body;

          await mergeOrganismeSansUaiDansOrganismeFiable(
            new ObjectId(organismeSansUaiId),
            new ObjectId(organismeFiableId)
          );
        })
      )
  );

  app.use("/api/v1/campagne", campagneRouter());
  app.use(authRouter);
}
