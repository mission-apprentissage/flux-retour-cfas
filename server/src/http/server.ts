import fs from "fs";

import * as Sentry from "@sentry/node";
import bodyParser from "body-parser";
import Boom from "boom";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import Joi from "joi";
import { ObjectId, WithId } from "mongodb";
import passport from "passport";
import { typesEffectifNominatif } from "shared/constants/indicateurs";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";
// catch all unhandled promise rejections and call the error middleware
import "express-async-errors";

import {
  activateUser,
  login,
  register,
  registerUnknownNetwork,
  sendForgotPasswordRequest,
} from "@/common/actions/account.actions";
import { getEffectifForm, updateEffectifFromForm } from "@/common/actions/effectifs.actions";
import { getDuplicatesEffectifsForOrganismeId } from "@/common/actions/effectifs.duplicates.actions";
import {
  dateFiltersSchema,
  effectifsFiltersTerritoireSchema,
  fullEffectifsFiltersSchema,
} from "@/common/actions/helpers/filters";
import { getOrganismePermission } from "@/common/actions/helpers/permissions-organisme";
import {
  getIndicateursNational,
  indicateursNationalFiltersSchema,
} from "@/common/actions/indicateurs/indicateurs-national.actions";
import {
  getEffectifsNominatifs,
  getIndicateursEffectifsParDepartement,
  getIndicateursEffectifsParOrganisme,
  getIndicateursOrganismesParDepartement,
  getOrganismeIndicateursEffectifs,
  getOrganismeIndicateursEffectifsParFormation,
  getOrganismeIndicateursOrganismes,
} from "@/common/actions/indicateurs/indicateurs.actions";
import { findDataFromSiret } from "@/common/actions/infoSiret.actions";
import { authenticateLegacy } from "@/common/actions/legacy/users.legacy.actions";
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
  listOrganisationOrganismes,
  generateApiKeyForOrg,
  getOrganismeByAPIKey,
  getOrganismeById,
  getOrganismeDetails,
  listContactsOrganisme,
  listOrganismesFormateurs,
  verifyOrganismeAPIKeyToUser,
  getOrganismeByUAIAndSIRET,
  getInvalidSiretsFromDossierApprenant,
  getInvalidUaisFromDossierApprenant,
  resetConfigurationERP,
  getStatOrganismes,
} from "@/common/actions/organismes/organismes.actions";
import {
  getDuplicatesOrganismes,
  mergeOrganismeSansUaiDansOrganismeFiable,
} from "@/common/actions/organismes/organismes.duplicates.actions";
import { searchOrganismesFormations } from "@/common/actions/organismes/organismes.formations.actions";
import { getFicheRNCP } from "@/common/actions/rncp.actions";
import { createSession, removeSession } from "@/common/actions/sessions.actions";
import { generateSifa } from "@/common/actions/sifa.actions/sifa.actions";
import { changePassword, updateUserProfile } from "@/common/actions/users.actions";
import { getCodePostalInfo } from "@/common/apis/apiTablesCorrespondances";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { CODE_POSTAL_REGEX } from "@/common/constants/validations";
import logger from "@/common/logger";
import { Organisme } from "@/common/model/@types";
import { effectifsDb, jobEventsDb, organisationsDb } from "@/common/model/collections";
import { apiRoles } from "@/common/roles";
import { initSentryExpress } from "@/common/services/sentry/sentry";
import { __dirname } from "@/common/utils/esmUtils";
import { responseWithCookie } from "@/common/utils/httpUtils";
import { createUserToken } from "@/common/utils/jwtUtils";
import { stripEmptyFields } from "@/common/utils/miscUtils";
import stripNullProperties from "@/common/utils/stripNullProperties";
import { algoUAI } from "@/common/utils/uaiUtils";
import { passwordSchema, validateFullObjectSchema, validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { SReqPostVerifyUser } from "@/common/validation/ApiERPSchema";
import { configurationERPSchema } from "@/common/validation/configurationERPSchema";
import { dossierApprenantSchemaV3WithMoreRequiredFieldsValidatingUAISiret } from "@/common/validation/dossierApprenantSchemaV3";
import loginSchemaLegacy from "@/common/validation/loginSchemaLegacy";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { registrationSchema, registrationUnknownNetworkSchema } from "@/common/validation/registrationSchema";
import userProfileSchema from "@/common/validation/userProfileSchema";
import { extensions, primitivesV1, primitivesV3 } from "@/common/validation/utils/zodPrimitives";
import config from "@/config";

import { authMiddleware, checkActivationToken, checkPasswordToken } from "./helpers/passport-handlers";
import errorMiddleware from "./middlewares/errorMiddleware";
import {
  requireAdministrator,
  requireEffectifOrganismePermission,
  requireOrganismePermission,
  returnResult,
} from "./middlewares/helpers";
import legacyUserPermissionsMiddleware from "./middlewares/legacyUserPermissionsMiddleware";
import { logMiddleware } from "./middlewares/logMiddleware";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication";
import requireBearerAuthentication from "./middlewares/requireBearerAuthentication";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication";
import validateRequestMiddleware from "./middlewares/validateRequestMiddleware";
import { openApiFilePath } from "./open-api-path";
import effectifsAdmin from "./routes/admin.routes/effectifs.routes";
import maintenancesAdmin from "./routes/admin.routes/maintenances.routes";
import organismesAdmin from "./routes/admin.routes/organismes.routes";
import usersAdmin from "./routes/admin.routes/users.routes";
import emails from "./routes/emails.routes";
import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes";
import { getOrganismeEffectifs, updateOrganismeEffectifs } from "./routes/specific.routes/organisme.routes";
import organismesRouter from "./routes/specific.routes/organismes.routes";

const openapiSpecs = JSON.parse(fs.readFileSync(openApiFilePath, "utf8"));

/**
 * Create the express app
 */
export default async function createServer(): Promise<Application> {
  const app = express();

  // Configure Sentry
  initSentryExpress(app);
  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  if (config.env === "local") {
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
          await jobEventsDb().findOne({});
          mongodbHealthy = true;
        } catch (err) {
          logger.error({ err }, "healthcheck failed");
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
        return await getOrganismeByUAIAndSIRET(uai, siret);
      })
    )
    .use("/api/emails", emails()) // No versionning to be sure emails links are always working
    .use("/api/doc", swaggerUi.serve, swaggerUi.setup(openapiSpecs))
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
        const filters = await validateFullZodObjectSchema(req.query, indicateursNationalFiltersSchema);
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

  app.use(
    ["/api/v3/dossiers-apprenants"],
    requireBearerAuthentication(),
    async (req, res, next) => {
      const organisme = (await getOrganismeByAPIKey(res.locals.token)) as WithId<Organisme>;
      if (!organisme) {
        throw new Error("Unauthorized");
      }

      let erpSource = "INCONNU";
      if (organisme.erps?.length) {
        if (organisme.erps?.length === 1) erpSource = organisme.erps[0];
        if (organisme.erps?.length > 1) erpSource = "MULTI_ERP";
      }

      (req.user as any) = {
        source: erpSource,
        source_organisme_id: organisme._id.toString(),
      };
      next();
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
    );

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
        returnResult(async (req, res) => {
          const filters = await validateFullZodObjectSchema(req.query, fullEffectifsFiltersSchema);
          const type = await z.enum(typesEffectifNominatif).parseAsync(req.params.type);
          const permissions = await getOrganismePermission(req.user, res.locals.organismeId, "effectifsNominatifs");
          if (!permissions || (permissions instanceof Array && !permissions.includes(type))) {
            throw Boom.forbidden("Permissions invalides");
          }
          return await getEffectifsNominatifs(req.user, filters, type, res.locals.organismeId);
        })
      )
      .get(
        "/indicateurs/organismes",
        returnResult(async (req, res) => {
          return await getOrganismeIndicateursOrganismes(res.locals.organismeId);
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
        "/effectifs",
        requireOrganismePermission("manageEffectifs"),
        returnResult(async (req, res) => {
          return await getOrganismeEffectifs(res.locals.organismeId, req.query.sifa === "true");
        })
      )
      .put(
        "/effectifs",
        requireOrganismePermission("manageEffectifs"),
        returnResult(async (req, res) => {
          const updated = await validateFullZodObjectSchema(req.body, {
            "apprenant.type_cfa": primitivesV3.type_cfa.optional(),
          });
          await updateOrganismeEffectifs(res.locals.organismeId, req.query.sifa === "true", updated);
        })
      )
      .get(
        "/duplicates",
        requireOrganismePermission("manageEffectifs"),
        returnResult(async (req, res) => {
          return await getDuplicatesEffectifsForOrganismeId(res.locals.organismeId);
        })
      )
      .get(
        "/sifa-export",
        requireOrganismePermission("manageEffectifs"),
        returnResult(async (req, res) => {
          const organismeId = res.locals.organismeId;
          const sifaCsv = await generateSifa(organismeId as any as ObjectId);
          res.attachment(`tdb-données-sifa-${organismeId}.csv`);
          return sifaCsv;
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
              return data;
            })
          )
          .use(
            // v3 is required in URL to consider the request as a v3 import
            "/import/v3",
            async (req, res, next) => {
              req.user.source = "televersement";
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

        return await getEffectifsNominatifs(req.user, filters, type);
      })
    )
    .get(
      "/api/v1/indicateurs/organismes/par-departement",
      returnResult(async (req) => {
        const filters = await validateFullZodObjectSchema(req.query, dateFiltersSchema);
        return await getIndicateursOrganismesParDepartement(req.user, filters);
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
      return await getFicheRNCP(req.params.code_rncp);
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
          error: !algoUAI(uai) ? `L'UAI ${uai} n'est pas valide` : null,
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
        return await getCodePostalInfo(codePostal);
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
          await inviteUserToOrganisation(req.user, req.body.email.toLowerCase());
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

  authRouter.use(
    "/api/v1/admin",
    express
      .Router()
      .use(requireAdministrator)
      .use("/users", usersAdmin())
      .use("/organismes", organismesAdmin())
      .use("/effectifs", effectifsAdmin())
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

          // génère une nouvelle session avec l'organisation usurpée
          const sessionToken = await createSession(req.user.email, {
            impersonatedOrganisation: organisation,
          });
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

  app.use(authRouter);
}
