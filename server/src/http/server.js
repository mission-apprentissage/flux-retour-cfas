import express from "express";
import bodyParser from "body-parser";
import { apiRoles, tdbRoles } from "../common/roles.js";
import logMiddleware from "./middlewares/logMiddleware.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import requireJwtAuthenticationMiddleware from "./middlewares/requireJwtAuthentication.js";
import permissionsMiddleware from "./middlewares/permissionsMiddleware.js";
import effectifsApprenantsRouter from "./routes/effectifs-apprenants.route.js";
import dossierApprenantRouter from "./routes/dossiers-apprenants.route.js";
import lienPriveCfaRouter from "./routes/lien-prive-cfa.route.js";
import loginRouter from "./routes/login.route.js";
import loginCfaRouter from "./routes/login-cfa.route.js";
import configRouter from "./routes/config.route.js";
import referentielRouter from "./routes/referentiel.route.js";
import effectifsRouter from "./routes/effectifs.route.js";
import effectifsExportRouter from "./routes/effectifs-export.route.js";
import cfasRouter from "./routes/cfas.route.js";
import formationRouter from "./routes/formations.route.js";
import healthcheckRouter from "./routes/healthcheck.route.js";
import demandeIdentifiantsRouter from "./routes/demande-identifiants.route.js";
import demandeBranchementErpRouter from "./routes/demande-branchement-erp.route.js";
import cacheRouter from "./routes/cache.route.js";
import updatePasswordRouter from "./routes/update-password.route.js";
import usersRouter from "./routes/users.route.js";
import reseauxCfasRouter from "./routes/reseaux-cfas.route.js";
import effectifsNationalRouter from "./routes/effectifs-national.route.js";

export default async (components) => {
  const app = express();

  const requireJwtAuthentication = requireJwtAuthenticationMiddleware(components);
  const adminOnly = permissionsMiddleware([apiRoles.administrator]);

  app.use(bodyParser.json());
  app.use(logMiddleware());

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
  // @deprecated to /dossiers-apprenants
  app.use(
    "/api/statut-candidats",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter(components)
  );
  app.use(
    "/api/dossiers-apprenants",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    dossierApprenantRouter(components)
  );
  app.use(
    "/api/liens-prives-cfas",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    lienPriveCfaRouter(components)
  );
  app.use(
    "/api/effectifs-apprenants",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsConsumer.anonymousDataConsumer]),
    effectifsApprenantsRouter(components)
  );
  app.use(
    "/api/effectifs",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.administrator, tdbRoles.pilot, tdbRoles.network, tdbRoles.cfa]),
    effectifsRouter(components)
  );
  app.use(
    "/api/effectifs-export",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.administrator, tdbRoles.pilot, tdbRoles.network, tdbRoles.cfa]),
    effectifsExportRouter(components)
  );

  // admin routes
  app.use("/api/users", requireJwtAuthentication, adminOnly, usersRouter(components));
  app.use("/api/reseaux-cfas", requireJwtAuthentication, adminOnly, reseauxCfasRouter(components));
  app.use("/api/cache", requireJwtAuthentication, adminOnly, cacheRouter(components));
  app.use("/api/config", requireJwtAuthentication, adminOnly, configRouter());

  app.use(errorMiddleware());

  return app;
};
