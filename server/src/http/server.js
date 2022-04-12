const express = require("express");
const bodyParser = require("body-parser");

const { apiRoles } = require("../common/roles");

const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const requireJwtAuthenticationMiddleware = require("./middlewares/requireJwtAuthentication");
const permissionsMiddleware = require("./middlewares/permissionsMiddleware");

const effectifsApprenantsRouter = require("./routes/effectifs-apprenants.route");
const dossierApprenantRouter = require("./routes/dossiers-apprenants.route");
const lienPriveCfaRouter = require("./routes/lien-prive-cfa.route");
const loginRouter = require("./routes/login.route");
const loginCfaRouter = require("./routes/login-cfa.route");
const configRouter = require("./routes/config.route");
const referentielRouter = require("./routes/referentiel.route");
const effectifsRouter = require("./routes/effectifs.route");
const cfasRouter = require("./routes/cfas.route");
const formationRouter = require("./routes/formations.route");
const healthcheckRouter = require("./routes/healthcheck.route");
const demandeIdentifiantsRouter = require("./routes/demande-identifiants.route");
const demandeLienPriveRouter = require("./routes/demande-lien-prive.route");
const demandeBranchementErpRouter = require("./routes/demande-branchement-erp.route");
const cacheRouter = require("./routes/cache.route");
const updatePasswordRouter = require("./routes/update-password.route");
const usersRouter = require("./routes/users.route");

module.exports = async (components) => {
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
  app.use("/api/referentiel", referentielRouter());
  app.use("/api/healthcheck", healthcheckRouter(components));
  app.use("/api/demande-identifiants", demandeIdentifiantsRouter(components));
  app.use("/api/demande-lien-prive", demandeLienPriveRouter(components));
  app.use("/api/demande-branchement-erp", demandeBranchementErpRouter(components));
  app.use("/api/update-password", updatePasswordRouter(components));

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
  app.use("/api/effectifs", requireJwtAuthentication, effectifsRouter(components));

  // admin routes
  app.use("/api/users", requireJwtAuthentication, adminOnly, usersRouter(components));
  app.use("/api/cache", requireJwtAuthentication, adminOnly, cacheRouter(components));
  app.use("/api/config", requireJwtAuthentication, adminOnly, configRouter());

  app.use(errorMiddleware());

  return app;
};
