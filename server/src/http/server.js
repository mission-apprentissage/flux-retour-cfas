import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { apiRoles } from "../common/roles.js";

import tryCatch from "./middlewares/tryCatchMiddleware.js";
import logMiddleware from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import requireApiKeyAuthenticationMiddleware from "./middlewares/requireApiKeyAuthentication.js";
import permissionsMiddleware from "./middlewares/permissionsMiddleware.js";
import permissionsOrganismeMiddleware from "./middlewares/permissionsOrganismeMiddleware.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { pageAccessMiddleware } from "./middlewares/pageAccessMiddleware.js";

import indicateursExportRouter from "./routes/specific.routes/indicateurs-export.routes.js";
import effectifsApprenantsRouter from "./routes/specific.routes/old/effectifs-apprenants.route.js";
import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.routes.js";
import lienPriveCfaRouter from "./routes/specific.routes/old/lien-prive-cfa.route.js";
import loginRouter from "./routes/specific.routes/old/login.route.js";
import referentielRouter from "./routes/specific.routes/old/referentiel.route.js";
import cfasRouter from "./routes/specific.routes/old/cfas.route.js";
import organismesRouter from "./routes/specific.routes/organismes.routes.js";
import formationRouter from "./routes/specific.routes/old/formations.route.js";
import indicateursNationalRouter from "./routes/specific.routes/indicateurs-national.routes.js";
import indicateursNationalDossiersRouter from "./routes/specific.routes/old/indicateurs-national.dossiers.route.js";
import indicateursNationalDossiersOldRouter from "./routes/specific.routes/old/indicateurs-national.dossiers.old.route.js";

import indicateursRouter from "./routes/specific.routes/indicateurs.routes.js";
import indicateursDossiersRouter from "./routes/specific.routes/old/indicateurs.dossiers.route.js";
import indicateursDossiersOldRouter from "./routes/specific.routes/old/indicateurs.dossiers.old.route.js";

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

export default async (services) => {
  const app = express();

  const requireJwtAuthentication = requireJwtAuthenticationMiddleware(services);

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
    // TODO Réactiver le middleware modifié ou en créer un spécifique ?
    // permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    indicateursRouter(services)
  );

  app.use("/api/indicateurs-national", indicateursNationalRouter(services)); // FRONT

  app.use(
    // FRONT
    "/api/v1/indicateurs-export",
    checkJwtToken,
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    indicateursExportRouter(services)
  );

  // Route dédiée à RCO
  app.use(
    "/api/effectifs-apprenants",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsConsumer.anonymousDataConsumer]),
    effectifsApprenantsRouter(services)
  );
  app.use("/api/healthcheck", healthcheckRouter(services));

  // Route pour ancien mécanisme de login : ERP TRANSMISSION => 4 erps GESTI,YMAG,SCFORM, FORMASUP PARIS HAUT DE FRANCE
  app.use("/api/login", loginRouter(services));

  // @deprecated to /dossiers-apprenants
  app.use(
    ["/api/statut-candidats", "/api/dossiers-apprenants"],
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter(services)
  );

  app.use(
    "/api/organismes",
    requireApiKeyAuthenticationMiddleware({ apiKeyValue: config.organismesConsultationApiKey }),
    organismesRouter(services)
  ); // EXPOSED TO REFERENTIEL PROTECTED BY API KEY

  // TODO : Routes à conserver temporairement le temps de la recette indicateurs via effectifs
  app.use("/api/indicateurs-national-dossiers", indicateursNationalDossiersRouter(services)); // FRONT
  app.use(
    // FRONT
    ["/api/indicateurs-dossiers"],
    checkJwtToken,
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    indicateursDossiersRouter(services)
  );
  app.use("/api/indicateurs-national-dossiers-old", indicateursNationalDossiersOldRouter(services)); // FRONT
  app.use(
    // FRONT
    ["/api/indicateurs-dossiers-old"],
    checkJwtToken,
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    indicateursDossiersOldRouter(services)
  );

  // TODO : Route à corriger / transformer pour le filtre par formations
  app.use("/api/formations", formationRouter(services)); // FRONT

  // TODO : Routes à supprimer une fois la V3 validée & recette faite &  système de cache enlevé
  app.use("/api/cfas", cfasRouter(services)); // FRONT
  app.use("/api/referentiel", referentielRouter(services)); // FRONT
  app.use(
    "/api/liens-prives-cfas",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    lienPriveCfaRouter(services)
  );
  app.get(
    "/api/cache",
    checkJwtToken,
    pageAccessMiddleware(["_ADMIN"]),
    tryCatch(async (req, res) => {
      await services.cache.flushAll();
      return res.json({});
    })
  );

  app.use(errorMiddleware());

  return app;
};
