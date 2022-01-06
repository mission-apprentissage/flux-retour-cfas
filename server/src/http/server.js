const express = require("express");
const bodyParser = require("body-parser");

const { apiRoles } = require("../common/roles");

const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const corsMiddleware = require("./middlewares/corsMiddleware");
const requireJwtAuthenticationMiddleware = require("./middlewares/requireJwtAuthentication");
const permissionsMiddleware = require("./middlewares/permissionsMiddleware");

const rcoRoute = require("./routes/rco");
const statutCandidatsRoute = require("./routes/statut-candidats");
const lienPriveCfaRoute = require("./routes/lien-prive-cfa");
const loginRoute = require("./routes/login");
const loginCfaRoute = require("./routes/login-cfa.route");
const userEventsRoute = require("./routes/userEvents");
const configRoute = require("./routes/config");
const referentielRoute = require("./routes/referentiel");
const effectifsRoute = require("./routes/effectifs");
const cfasRoute = require("./routes/cfas");
const formationRoutes = require("./routes/formations");
const healthcheckRoute = require("./routes/healthcheck");
const demandeIdentifiants = require("./routes/demande-identifiants");
const demandeLienPriveRoute = require("./routes/demande-lien-prive");
const demandeBranchementErpRoute = require("./routes/demande-branchement-erp");
const cacheRouter = require("./routes/cache");

module.exports = async (components) => {
  const app = express();

  const requireJwtAuthentication = requireJwtAuthenticationMiddleware(components);
  const adminOnly = permissionsMiddleware([apiRoles.administrator]);

  app.use(bodyParser.json());
  app.use(corsMiddleware());
  app.use(logMiddleware());

  // open routes
  app.use("/api/login", loginRoute(components));
  app.use("/api/login-cfa", loginCfaRoute(components));
  app.use("/api/formations", formationRoutes(components));
  app.use("/api/cfas", cfasRoute(components));
  app.use("/api/referentiel", referentielRoute());
  app.use("/api/healthcheck", healthcheckRoute(components));
  app.use("/api/demande-identifiants", demandeIdentifiants(components));
  app.use("/api/demande-lien-prive", demandeLienPriveRoute(components));
  app.use("/api/demande-branchement-erp", demandeBranchementErpRoute(components));

  // requires JWT auth
  app.use(
    "/api/statut-candidats",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    statutCandidatsRoute(components)
  );
  app.use(
    "/api/liens-prives-cfas",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsSeeder]),
    lienPriveCfaRoute(components)
  );
  app.use(
    "/api/rco",
    requireJwtAuthentication,
    permissionsMiddleware([apiRoles.apiStatutsConsumer.anonymousDataConsumer]),
    rcoRoute(components)
  );
  app.use("/api/effectifs", requireJwtAuthentication, effectifsRoute(components));

  // admin routes
  app.use("/api/cache", requireJwtAuthentication, adminOnly, cacheRouter(components));
  app.use("/api/userEvents", requireJwtAuthentication, adminOnly, userEventsRoute(components));
  app.use("/api/config", requireJwtAuthentication, adminOnly, configRoute());

  app.use(errorMiddleware());

  return app;
};
