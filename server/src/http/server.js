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
import loginCfaRouter from "./routes/specific.routes/old/login-cfa.route.js";
import referentielRouter from "./routes/specific.routes/old/referentiel.route.js";
import cfasRouter from "./routes/specific.routes/old/cfas.route.js";
import formationRouter from "./routes/specific.routes/old/formations.route.js";
import reseauxCfasRouter from "./routes/specific.routes/old/reseaux-cfas.route.js";
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
import espace from "./routes/specific.routes/espace.routes.js";

import sifa from "./routes/specific.routes/temp.routes/sifa.routes.js"; // TMP
import upload from "./routes/specific.routes/temp.routes/upload.routes.js"; // TMP

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
  app.use("/api/v1/espace", checkJwtToken, espace());
  app.use("/api/v1/organisme", checkJwtToken, organisme(components));

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
    pageAccessMiddleware(["_ADMIN"]), // TODO [tech]
    tryCatch(async (req, res) => {
      await components.cache.clear();
      return res.json({});
    })
  );

  // TODO TEST ROUTES TMEPORARY
  app.use("/api/v1/sifa", sifa()); // TODO TMP [tech]
  app.use("/api/v1/upload", upload(components));

  // TODO TDB OLD PREVIOUS [tech]
  //// TODO
  app.use("/api/formations", formationRouter(components)); // FRONT
  app.use("/api/cfas", cfasRouter(components)); // FRONT
  app.use("/api/referentiel", referentielRouter(components)); // FRONT
  app.use("/api/effectifs-national", effectifsNationalRouter(components)); // FRONT
  app.use(
    // FRONT
    ["/api/effectifs", "/api/v1/effectifs"],
    checkJwtToken,
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    effectifs(components)
  );
  app.use(
    // FRONT
    "/api/effectifs-export",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.administrator, tdbRoles.pilot, tdbRoles.network, tdbRoles.cfa]),
    effectifsExportRouter(components)
  );

  // ROUTES BACK TO KEEEP !
  app.use(
    // BACK RCO
    "/api/effectifs-apprenants",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsConsumer.anonymousDataConsumer]),
    effectifsApprenantsRouter(components)
  );
  app.use("/api/healthcheck", healthcheckRouter(components));
  app.use("/api/login-cfa", loginCfaRouter(components)); // FRONT / BACK
  app.use("/api/login", loginRouter(components)); // BACK
  // requires JWT auth
  app.use(
    "/api/liens-prives-cfas",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    lienPriveCfaRouter(components)
  ); // BACK !important

  // @deprecated to /dossiers-apprenants
  app.use(
    // BACK !important
    ["/api/statut-candidats", "/api/dossiers-apprenants"],
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter(components)
  );

  app.use(errorMiddleware());

  return app;
};
