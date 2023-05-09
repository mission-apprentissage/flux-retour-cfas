import fs from "fs";
import path from "path";

import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import bodyParser from "body-parser";
import Boom from "boom";
import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, RequestHandler, Response } from "express";
import listEndpoints from "express-list-endpoints";
import Joi from "joi";
import { ObjectId } from "mongodb";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

// catch all unhandled promise rejections and call the error middleware
import "express-async-errors";

import { sendForgotPasswordRequest, register, activateUser } from "@/common/actions/account.actions";
import { exportAnonymizedEffectifsAsCSV } from "@/common/actions/effectifs/effectifs-export.actions";
import { getIndicateursNational, getOrganismeIndicateurs } from "@/common/actions/effectifs/effectifs.actions";
import { getFormationWithCfd, searchFormations } from "@/common/actions/formations.actions";
import { legacyEffectifsFiltersSchema } from "@/common/actions/helpers/filters";
import { authenticateLegacy } from "@/common/actions/legacy/users.legacy.actions";
import { findMaintenanceMessages } from "@/common/actions/maintenances.actions";
import {
  cancelInvitation,
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
  findUserOrganismes,
  searchOrganismes,
  findOrganismesByUAI,
  findOrganismesBySIRET,
  getOrganismeByUAIAndSIRETOrFallbackAPIEntreprise,
  configureOrganismeERP,
  getOrganismeById,
} from "@/common/actions/organismes/organismes.actions";
import { generateSifa } from "@/common/actions/sifa.actions/sifa.actions";
import { changePassword, updateUserProfile } from "@/common/actions/users.actions";
import { TETE_DE_RESEAUX } from "@/common/constants/networks";
import logger from "@/common/logger";
import { jobEventsDb } from "@/common/model/collections";
import { apiRoles } from "@/common/roles";
import { packageJson } from "@/common/utils/esmUtils";
import { createUserToken } from "@/common/utils/jwtUtils";
import {
  passwordSchema,
  uaiSchema,
  validateFullObjectSchema,
  validateFullZodObjectSchema,
} from "@/common/utils/validationUtils";
import { configurationERPSchema } from "@/common/validation/configurationERPSchema";
import loginSchemaLegacy from "@/common/validation/loginSchemaLegacy";
import objectIdSchema from "@/common/validation/objectIdSchema";
import organismeOrFormationSearchSchema from "@/common/validation/organismeOrFormationSearchSchema";
import { registrationSchema } from "@/common/validation/registrationSchema";
import uploadedDocumentSchema from "@/common/validation/uploadedDocumentSchema";
import uploadMappingSchema from "@/common/validation/uploadMappingSchema";
import uploadUpdateDocumentSchema from "@/common/validation/uploadUpdateDocumentSchema";
import userProfileSchema from "@/common/validation/userProfileSchema";
import config from "@/config";

import { authMiddleware, checkActivationToken, checkPasswordToken } from "./helpers/passport-handlers";
import { authOrgMiddleware } from "./middlewares/authOrgMiddleware";
import errorMiddleware from "./middlewares/errorMiddleware";
import { requireAdministrator, returnResult } from "./middlewares/helpers";
import legacyUserPermissionsMiddleware from "./middlewares/legacyUserPermissionsMiddleware";
import { logMiddleware } from "./middlewares/logMiddleware";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication";
import validateRequestMiddleware from "./middlewares/validateRequestMiddleware";
import effectifsAdmin from "./routes/admin.routes/effectifs.routes";
import maintenancesAdmin from "./routes/admin.routes/maintenances.routes";
import organismesAdmin from "./routes/admin.routes/organismes.routes";
import statsAdmin from "./routes/admin.routes/stats.routes";
import usersAdmin from "./routes/admin.routes/users.routes";
import emails from "./routes/emails.routes";
import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes";
import effectif from "./routes/specific.routes/effectif.routes";
import indicateursRouter from "./routes/specific.routes/indicateurs.routes";
import {
  getOrganismeByUAIAvecSousEtablissements,
  getOrganismeEffectifs,
} from "./routes/specific.routes/organisme.routes";
import organismesRouter from "./routes/specific.routes/organismes.routes";
import { serverEventsHandler } from "./routes/specific.routes/server-events.routes";
import upload from "./routes/specific.routes/upload.routes";
import auth from "./routes/user.routes/auth.routes";

const openapiSpecs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "./src/http/open-api.json"), "utf8"));

/**
 * Create the express app
 */
export default async function createServer(): Promise<Application> {
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
          version: packageJson.version,
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
          version: packageJson.version,
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
        const { siret } = await validateFullObjectSchema(req.body, {
          siret: Joi.string().required(),
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
        return await getOrganismeByUAIAndSIRETOrFallbackAPIEntreprise(uai, siret);
      })
    )
    .use("/api/emails", emails()) // No versionning to be sure emails links are always working
    .use("/api/v1/auth", auth())
    .use("/api/doc", swaggerUi.serve, swaggerUi.setup(openapiSpecs))
    .post(
      "/api/v1/auth/register",
      returnResult(async (req) => {
        const registration = await validateFullZodObjectSchema(req.body, registrationSchema);
        registration.user.email = registration.user.email.toLowerCase();
        return await register(registration);
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
        const { email } = await validateFullObjectSchema(req.body, {
          email: Joi.string().email().required().lowercase().trim(),
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
      "/api/indicateurs-national",
      returnResult(async (req) => {
        const { date } = await validateFullZodObjectSchema(req.query, {
          date: legacyEffectifsFiltersSchema.date,
        });
        return await getIndicateursNational(date);
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
        await updateUserProfile(req.user, { has_accepted_cgu: req.params.version });
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
        authOrgMiddleware("reader"),
        returnResult(async (req, res) => {
          return await getOrganismeById(res.locals.organismeId); // double récupération avec les permissions mais pas très grave
        })
      )
      .get(
        "/indicateurs",
        authOrgMiddleware("reader"),
        returnResult(async (req, res) => {
          const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
          return await getOrganismeIndicateurs(req.user, res.locals.organismeId, filters);
        })
      )
      .get(
        "/effectifs",
        authOrgMiddleware("manager"),
        returnResult(async (req, res) => {
          return await getOrganismeEffectifs(
            res.locals.organismeId,
            req.query.annee_scolaire as string | undefined,
            req.query.sifa === "true"
          );
        })
      )
      .get(
        "/sifa-export",
        authOrgMiddleware("manager"),
        returnResult(async (req, res) => {
          const organismeId = res.locals.organismeId;
          const sifaCsv = await generateSifa(organismeId as any as ObjectId);
          res.attachment(`tdb-données-sifa-${organismeId}.csv`);
          return sifaCsv;
        })
      )
      .put(
        "/configure-erp",
        authOrgMiddleware("manager"),
        returnResult(async (req, res) => {
          const conf = await validateFullZodObjectSchema(req.body, configurationERPSchema);
          await configureOrganismeERP(req.user, res.locals.organismeId, conf);
        })
      )
      .use(
        "/upload",
        authOrgMiddleware("manager"),
        express
          .Router()
          .get("/", validateRequestMiddleware({ body: uploadedDocumentSchema() }), async (req, res) => {
            return upload.getDocument(res.locals.organismeId, req.body, res);
          })
          .post("/", async (req, res) => {
            return upload.createUpload(res.locals.organismeId, req, res);
          })
          .get(
            "/get",
            returnResult(async (req, res) => {
              return upload.getUpload(res.locals.organismeId);
            })
          )
          .post(
            "/pre-import",
            validateRequestMiddleware({ body: uploadMappingSchema() }),
            returnResult(async (req, res) => {
              let userMapping = req.body;
              return upload.preImport(res.locals.organismeId, req.user, userMapping);
            })
          )
          .post(
            "/import",
            returnResult(async (req, res) => {
              return upload.import(res.locals.organismeId, req.user);
            })
          )
          .get(
            "/analyse",
            returnResult(async (req, res) => {
              return upload.analyse(res.locals.organismeId, req.user);
            })
          )
          // Manage uploaded documents (delete, set mapping modele)
          .use(
            "/doc/:document_id",
            authOrgMiddleware("manager"),
            validateRequestMiddleware({ params: objectIdSchema("document_id") }),
            ((req: Request<{ document_id: ObjectId }>, res: Response, next: NextFunction) => {
              // TODO investiguer pourquoi req.params.document_id est de type string ici
              res.locals.documentId = new ObjectId(req.params.document_id);
              next();
            }) as RequestHandler<never, any, never, never, { documentId: ObjectId }>,
            express
              .Router()
              .put(
                "/setDocumentType",
                validateRequestMiddleware({ body: uploadUpdateDocumentSchema() }),
                returnResult(async (req, res) => {
                  return upload.setDocumentType(res.locals.organismeId, res.locals.documentId, req.body.type_document);
                })
              )
              .delete(
                "",
                returnResult(async (req, res) => {
                  return upload.deleteUploadedDocument(res.locals.organismeId, res.locals.documentId);
                })
              )
          )
      )
  );

  // LEGACY écrans indicateurs
  authRouter
    .get(
      "/api/v1/organisme/:uai", // FIXME SECURITE openbar pour la recherche
      returnResult(async (req) => {
        const { uai } = await validateFullObjectSchema(req.params, {
          uai: uaiSchema(),
        });
        return await getOrganismeByUAIAvecSousEtablissements(uai);
      })
    )
    .post(
      "/api/v1/organismes/search",
      validateRequestMiddleware({ body: organismeOrFormationSearchSchema() }),
      returnResult(async (req) => {
        return await searchOrganismes(req.user, req.body as any);
      })
    )
    .use("/api/v1/effectif", effectif())
    .get("/api/v1/server-events", serverEventsHandler)
    .use("/api/indicateurs", indicateursRouter())
    .get("/api/v1/indicateurs-export", async (req, res) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      const csv = await exportAnonymizedEffectifsAsCSV(req.user, filters);
      res.attachment("export-csv-effectifs-anonymized-list.csv").send(csv);
    });

  /*
   * formations
   */
  authRouter
    .post(
      "/api/formations/search",
      validateRequestMiddleware({ body: organismeOrFormationSearchSchema() }),
      returnResult(async (req) => {
        return await searchFormations(req.body);
      })
    )
    .get(
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
          return await findUserOrganismes(req.user);
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
  authRouter.use(
    "/api/v1/admin",
    express
      .Router()
      .use(requireAdministrator)
      .use("/users", usersAdmin())
      .use("/organismes", organismesAdmin())
      .use("/effectifs", effectifsAdmin())
      .use("/stats", statsAdmin())
      .use("/maintenanceMessages", maintenancesAdmin())
  );

  app.use(authRouter);

  if (process.env.NODE_ENV !== "test") {
    listEndpoints(app).map(({ path, methods }: { path: string; methods: string[] }) =>
      console.info(`${methods.join(", ").padStart(20)} ${path}`)
    );
  }
}
