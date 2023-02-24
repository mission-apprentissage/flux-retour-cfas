import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

import { apiRoles } from "../common/roles.js";

import logMiddleware from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication.js";
import permissionsMiddleware from "./middlewares/permissionsMiddleware.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { pageAccessMiddleware } from "./middlewares/pageAccessMiddleware.js";

import indicateursExportRouter from "./routes/specific.routes/indicateurs-export.routes.js";
import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes.js";
import loginRouter from "./routes/specific.routes/old/login.route.js";
import referentielRouter from "./routes/specific.routes/old/referentiel.route.js";
import organismesRouter from "./routes/specific.routes/organismes.routes.js";
import formationRouter from "./routes/specific.routes/old/formations.route.js";
import indicateursNationalRouter from "./routes/specific.routes/indicateurs-national.routes.js";
import indicateursRouter from "./routes/specific.routes/indicateurs.routes.js";
import serverEvents from "./routes/specific.routes/server-events.routes.js";

import emails from "./routes/emails.routes.js";
import session from "./routes/session.routes.js";
import healthcheckRouter from "./routes/healthcheck.route.js";

import auth from "./routes/user.routes/auth.routes.js";
import register from "./routes/user.routes/register.routes.js";
import password from "./routes/user.routes/password.routes.js";
import profile from "./routes/user.routes/profile.routes.js";

import organisme from "./routes/specific.routes/organisme.routes.js";
import effectif from "./routes/specific.routes/effectif.routes.js";
import espace from "./routes/specific.routes/espace.routes.js";
import upload from "./routes/specific.routes/serp.routes/upload.routes.js";

import usersAdmin from "./routes/admin.routes/users.routes.js";
import rolesAdmin from "./routes/admin.routes/roles.routes.js";
import maintenancesAdmin from "./routes/admin.routes/maintenances.routes.js";
import maintenancesRoutes from "./routes/maintenances.routes.js";
import config from "../config.js";
import { indicateursPermissions } from "./middlewares/permissionsOrganismeMiddleware.js";

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

  const requireJwtAuthentication = requireJwtAuthenticationMiddleware();

  const checkJwtToken = authMiddleware();

  app.use(bodyParser.json());
  app.use(logMiddleware());
  app.use(cookieParser());
  app.use(passport.initialize());

  // public access
  app.use("/api/emails", emails(services)); // No versionning to be sure emails links are always working
  app.use("/api/v1/auth", auth());
  app.use("/api/v1/auth", register(services));
  app.use("/api/v1/password", password(services));
  app.use("/api/v1/maintenanceMessages", maintenancesRoutes());

  // private access
  app.use("/api/v1/session", checkJwtToken, session());
  app.use("/api/v1/profile", checkJwtToken, profile());
  app.use("/api/v1/espace", checkJwtToken, espace());
  app.use("/api/v1/organisme", checkJwtToken, organisme(services));
  app.use("/api/v1/effectif", checkJwtToken, effectif());
  app.use("/api/v1/upload", checkJwtToken, upload(services));
  app.use("/api/v1/server-events", checkJwtToken, serverEvents());

  // private admin access
  app.use(
    "/api/v1/admin",
    checkJwtToken,
    pageAccessMiddleware(["admin/page_gestion_utilisateurs"]),
    usersAdmin(services)
  );
  app.use(
    "/api/v1/admin",
    checkJwtToken,
    pageAccessMiddleware(["admin/page_gestion_utilisateurs", "admin/page_gestion_roles"]),
    rolesAdmin()
  );
  app.use(
    "/api/v1/admin/maintenanceMessages",
    checkJwtToken,
    pageAccessMiddleware(["admin/page_message_maintenance"]),
    maintenancesAdmin()
  );

  // Routes de calcul & export des indicateurs
  app.use(
    // FRONT
    ["/api/indicateurs"],
    checkJwtToken,
    indicateursPermissions(),
    indicateursRouter()
  );

  app.use("/api/indicateurs-national", indicateursNationalRouter(services)); // FRONT

  app.use(
    // FRONT
    "/api/v1/indicateurs-export",
    checkJwtToken,
    indicateursPermissions(),
    indicateursExportRouter()
  );

  app.use("/api/healthcheck", healthcheckRouter());

  // Route pour ancien mécanisme de login : ERP TRANSMISSION => 4 erps GESTI,YMAG,SCFORM, FORMASUP PARIS HAUT DE FRANCE
  app.use("/api/login", loginRouter());

  // @deprecated to /dossiers-apprenants
  app.use(
    ["/api/statut-candidats", "/api/dossiers-apprenants"],
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter()
  );

  app.use(
    "/api/organismes",
    requireApiKeyAuthenticationMiddleware({ apiKeyValue: config.organismesConsultationApiKey }),
    organismesRouter()
  ); // EXPOSED TO REFERENTIEL PROTECTED BY API KEY

  app.use("/api/formations", formationRouter()); // FRONT
  app.use("/api/referentiel", referentielRouter()); // FRONT

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  app.use(errorMiddleware());

  return app;
};
