import express from "express";
import passport from "passport";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import config from "../config.js";

import { apiRoles, tdbRoles } from "../common/roles.js";

import tryCatch from "./middlewares/tryCatchMiddleware.js";
import logMiddleware from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import permissionsMiddleware from "./middlewares/permissionsMiddleware.js";
import permissionsOrganismeMiddleware from "./middlewares/permissionsOrganismeMiddleware.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { pageAccessMiddleware } from "./middlewares/pageAccessMiddleware.js";

import effectifsExportRouter from "./routes/specific.routes/effectifs-export.route.js";
import effectifsApprenantsRouter from "./routes/specific.routes/effectifs-apprenants.route.js";
import dossierApprenantRouter from "./routes/specific.routes/dossiers-apprenants.route.js";
import lienPriveCfaRouter from "./routes/specific.routes/lien-prive-cfa.route.js";
import loginRouter from "./routes/specific.routes/login.route.js";
import loginCfaRouter from "./routes/specific.routes/login-cfa.route.js";
import referentielRouter from "./routes/specific.routes/referentiel.route.js";
import cfasRouter from "./routes/specific.routes/cfas.route.js";
import formationRouter from "./routes/specific.routes/formations.route.js";
import demandeIdentifiantsRouter from "./routes/specific.routes/demande-identifiants.route.js";
import demandeBranchementErpRouter from "./routes/specific.routes/demande-branchement-erp.route.js";
import updatePasswordRouter from "./routes/specific.routes/update-password.route.js";
import reseauxCfasRouter from "./routes/specific.routes/reseaux-cfas.route.js";
import effectifsNationalRouter from "./routes/specific.routes/effectifs-national.route.js";

import emails from "./routes/emails.routes.js";
import session from "./routes/session.routes.js";
import healthcheckRouter from "./routes/healthcheck.route.js";

import auth from "./routes/user.routes/auth.routes.js";
import register from "./routes/user.routes/register.routes.js";
import password from "./routes/user.routes/password.routes.js";
import profile from "./routes/user.routes/profile.routes.js";

import effectifs from "./routes/specific.routes/effectifs.route.js";
import sifa from "./routes/specific.temp.routes/sifa.routes.js"; // TMP
import upload from "./routes/specific.temp.routes/upload.routes.js"; // TMP

import usersAdmin from "./routes/admin.routes/users.routes.js";
import rolesAdmin from "./routes/admin.routes/roles.routes.js";

export default async (components) => {
  const app = express();

  const requireJwtAuthentication = requireJwtAuthenticationMiddleware(components);

  const checkJwtToken = authMiddleware();

  app.use(bodyParser.json());
  app.use(logMiddleware());
  app.use(cookieParser());
  app.use(passport.initialize());

  // public access
  app.use("/api/emails", emails(components)); // No versionning to be sure emails links are always working
  app.use("/api/v1/auth", auth());
  app.use("/api/v1/auth", register(components));
  app.use("/api/v1/password", password(components));

  // private access
  app.use("/api/v1/session", checkJwtToken, session());
  app.use("/api/v1/profile", checkJwtToken, profile());
  app.use(
    ["/api/effectifs", "/api/v1/effectifs"],
    checkJwtToken,
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    effectifs(components)
  );
  app.use(
    "/api/effectifs-apprenants",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsConsumer.anonymousDataConsumer]),
    effectifsApprenantsRouter(components)
  );
  app.use(
    "/api/effectifs-export",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.administrator, tdbRoles.pilot, tdbRoles.network, tdbRoles.cfa]),
    effectifsExportRouter(components)
  );

  // private admin access
  app.use(
    "/api/v1/admin",
    checkJwtToken,
    pageAccessMiddleware(["admin/page_gestion_utilisateurs"]),
    usersAdmin(components)
  );
  app.use(
    "/api/v1/admin",
    checkJwtToken,
    pageAccessMiddleware(["admin/page_gestion_utilisateurs", "admin/page_gestion_roles"]),
    rolesAdmin()
  );
  app.use(
    "/api/v1/admin/reseaux-cfas",
    checkJwtToken,
    pageAccessMiddleware(["admin/page_gestion_reseaux_cfa"]),
    reseauxCfasRouter(components)
  );
  app.get(
    "/api/cache",
    checkJwtToken,
    pageAccessMiddleware(["_ADMIN"]), // TODO
    tryCatch(async (req, res) => {
      await components.cache.clear();
      return res.json({});
    })
  );
  app.get(
    "/api/config",
    checkJwtToken,
    pageAccessMiddleware(["_ADMIN"]), // TODO
    tryCatch(async (req, res) => {
      return res.json({
        config,
      });
    })
  );

  // TODO TEST ROUTES TMEPORARY
  app.use("/api/v1/sifa", sifa()); // TODO TMP
  app.use("/api/v1/upload", upload(components));

  // TDB OLD PREVIOUS ROUTES
  // open routes
  app.use("/api/login", loginRouter(components));
  app.use("/api/login-cfa", loginCfaRouter(components));
  app.use("/api/formations", formationRouter(components));
  app.use("/api/cfas", cfasRouter(components));
  app.use("/api/referentiel", referentielRouter(components));
  app.use("/api/healthcheck", healthcheckRouter(components));
  app.use("/api/demande-identifiants", demandeIdentifiantsRouter(components));
  app.use("/api/demande-branchement-erp", demandeBranchementErpRouter(components));
  app.use("/api/update-password", updatePasswordRouter(components));
  app.use("/api/effectifs-national", effectifsNationalRouter(components));

  // requires JWT auth
  app.use(
    "/api/liens-prives-cfas",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    lienPriveCfaRouter(components)
  );

  // @deprecated to /dossiers-apprenants
  app.use(
    ["/api/statut-candidats", "/api/dossiers-apprenants"],
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter(components)
  );

  app.use(errorMiddleware());

  return app;
};
