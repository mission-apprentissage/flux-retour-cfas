import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

import { apiRoles, tdbRoles } from "../common/roles.js";

import tryCatch from "./middlewares/tryCatchMiddleware.js";
import logMiddleware from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import permissionsMiddleware from "./middlewares/permissionsMiddleware.js";
import permissionsOrganismeMiddleware from "./middlewares/permissionsOrganismeMiddleware.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { pageAccessMiddleware } from "./middlewares/pageAccessMiddleware.js";

import effectifsExportRouter from "./routes/specific.routes/old/effectifs-export.route.js";
import effectifsApprenantsRouter from "./routes/specific.routes/old/effectifs-apprenants.route.js";
import dossierApprenantRouter from "./routes/specific.routes/old/dossiers-apprenants.route.js";
import lienPriveCfaRouter from "./routes/specific.routes/old/lien-prive-cfa.route.js";
import loginRouter from "./routes/specific.routes/old/login.route.js";
import referentielRouter from "./routes/specific.routes/old/referentiel.route.js";
import cfasRouter from "./routes/specific.routes/old/cfas.route.js";
import formationRouter from "./routes/specific.routes/old/formations.route.js";
import effectifsNationalRouter from "./routes/specific.routes/old/effectifs-national.route.js";
import effectifs from "./routes/specific.routes/old/effectifs.route.js";

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
  app.use("/api/v1/organisme", checkJwtToken, organisme());
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

  app.get(
    "/api/cache",
    checkJwtToken,
    pageAccessMiddleware(["_ADMIN"]), // TODO [tech]
    tryCatch(async (req, res) => {
      await services.cache.flushAll();
      return res.json({});
    })
  );

  // TODO TDB OLD PREVIOUS [tech]
  //// TODO
  app.use("/api/formations", formationRouter(services)); // FRONT
  app.use("/api/cfas", cfasRouter(services)); // FRONT
  app.use("/api/referentiel", referentielRouter(services)); // FRONT
  app.use("/api/effectifs-national", effectifsNationalRouter(services)); // FRONT
  app.use(
    // FRONT
    ["/api/effectifs", "/api/v1/effectifs"],
    checkJwtToken,
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    effectifs(services)
  );
  app.use(
    // FRONT
    "/api/effectifs-export",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.administrator, tdbRoles.pilot, tdbRoles.network, tdbRoles.cfa]),
    effectifsExportRouter(services)
  );

  // ROUTES BACK TO KEEEP !
  app.use(
    // BACK RCO
    "/api/effectifs-apprenants",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsConsumer.anonymousDataConsumer]),
    effectifsApprenantsRouter(services)
  );
  app.use("/api/healthcheck", healthcheckRouter(services));

  app.use("/api/login", loginRouter(services)); // BACK
  // ERP TRANSMISSION => 4 erps GESTI,YMAG,SCFORM, FORMASUP PARIS HAUT DE FRANCE

  // requires JWT auth
  app.use(
    "/api/liens-prives-cfas",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    lienPriveCfaRouter(services)
  );

  // @deprecated to /dossiers-apprenants
  app.use(
    // BACK !important
    ["/api/statut-candidats", "/api/dossiers-apprenants"],
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter(services)
  );

  app.use(errorMiddleware());

  return app;
};
