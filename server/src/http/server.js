const express = require("express");
const bodyParser = require("body-parser");

const { apiRoles, PARTAGE_SIMPLIFIE_ROLES } = require("../common/roles");

const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const requireJwtAuthenticationMiddleware = require("./middlewares/requireJwtAuthentication");
const requirePsJwtAuthentication = require("./middlewares/requirePsJwtAuthentication.js");

const permissionsMiddleware = require("./middlewares/permissionsMiddleware");
const rolesMiddleware = require("./middlewares/rolesMiddleware.js");

const effectifsApprenantsRouter = require("./routes/effectifs-apprenants.route");
const dossierApprenantRouter = require("./routes/dossiers-apprenants.route");
const lienPriveCfaRouter = require("./routes/lien-prive-cfa.route");
const loginRouter = require("./routes/login.route");
const loginCfaRouter = require("./routes/login-cfa.route");
const configRouter = require("./routes/config.route");
const referentielRouter = require("./routes/referentiel.route");
const effectifsRouter = require("./routes/effectifs.route");
const effecitfsExportRouter = require("./routes/effectifs-export.route");
const cfasRouter = require("./routes/cfas.route");
const formationRouter = require("./routes/formations.route");
const healthcheckRouter = require("./routes/healthcheck.route");
const demandeIdentifiantsRouter = require("./routes/demande-identifiants.route");
const demandeBranchementErpRouter = require("./routes/demande-branchement-erp.route");
const cacheRouter = require("./routes/cache.route");
const updatePasswordRouter = require("./routes/update-password.route");
const usersRouter = require("./routes/users.route");
const reseauxCfasRouter = require("./routes/reseaux-cfas.route");
const effectifsNationalRouter = require("./routes/effectifs-national.route");

// PS routers
const demandesActivationCompteRouter = require("./routes/partage-simplifie/demandesActivationCompte.route.js");
const loginPsRouter = require("./routes/partage-simplifie/login.route.js");
const registerPsRouter = require("./routes/partage-simplifie/register.route.js");
const userPsRouter = require("./routes/partage-simplifie/user.route.js");
const organismesRouter = require("./routes/partage-simplifie/organismes.route.js");
const signalementAnomaliePsRouter = require("./routes/partage-simplifie/signalementAnomalie.route.js");
const ofRouter = require("./routes/partage-simplifie/of.route.js");
const usersPsRouter = require("./routes/partage-simplifie/users.route.js");
const donneesApprenantsPsRouter = require("./routes/partage-simplifie/donneesApprenants.route.js");

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
  app.use("/api/referentiel", referentielRouter(components));
  app.use("/api/healthcheck", healthcheckRouter(components));
  app.use("/api/demande-identifiants", demandeIdentifiantsRouter(components));
  app.use("/api/demande-branchement-erp", demandeBranchementErpRouter(components));
  app.use("/api/update-password", updatePasswordRouter(components));
  app.use("/api/effectifs-national", effectifsNationalRouter(components));

  // Partage Simplifie open routes
  app.use("/api/partage-simplifie/demandes-activation-compte", demandesActivationCompteRouter(components));
  app.use("/api/partage-simplifie/login", loginPsRouter(components));
  app.use("/api/partage-simplifie/register", registerPsRouter(components));
  app.use("/api/partage-simplifie/user", userPsRouter(components));
  app.use("/api/partage-simplifie/organismes", organismesRouter(components));
  app.use("/api/partage-simplifie/signalementAnomalie", signalementAnomaliePsRouter(components));

  // Partage Simplifie user OF routes using requirePsJwtAuthentication (custom jwt authentication using psUsers)
  app.use(
    "/api/partage-simplifie/of",
    requirePsJwtAuthentication(components),
    rolesMiddleware(PARTAGE_SIMPLIFIE_ROLES.OF),
    ofRouter(components)
  );
  app.use(
    "/api/partage-simplifie/donnees-apprenants",
    requirePsJwtAuthentication(components),
    rolesMiddleware(PARTAGE_SIMPLIFIE_ROLES.OF),
    donneesApprenantsPsRouter(components)
  );

  // Partage Simplifie admin routes using requirePsJwtAuthentication (custom jwt authentication using psUsers)
  app.use(
    "/api/partage-simplifie/users",
    requirePsJwtAuthentication(components),
    rolesMiddleware(PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR),
    usersPsRouter(components)
  );

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
  app.use("/api/effectifs-export", requireJwtAuthentication, effecitfsExportRouter(components));

  // admin routes
  app.use("/api/users", requireJwtAuthentication, adminOnly, usersRouter(components));
  app.use("/api/reseaux-cfas", requireJwtAuthentication, adminOnly, reseauxCfasRouter(components));
  app.use("/api/cache", requireJwtAuthentication, adminOnly, cacheRouter(components));
  app.use("/api/config", requireJwtAuthentication, adminOnly, configRouter());

  app.use(errorMiddleware());

  return app;
};
