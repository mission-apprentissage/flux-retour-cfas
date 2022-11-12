import express from 'express';
import bodyParser from 'body-parser';
import { apiRoles } from '../common/roles';
import logMiddleware from './middlewares/logMiddleware';
import errorMiddleware from './middlewares/errorMiddleware';
import requireJwtAuthenticationMiddleware from './middlewares/requireJwtAuthentication';
import permissionsMiddleware from './middlewares/permissionsMiddleware';
import effectifsApprenantsRouter from './routes/effectifs-apprenants.route';
import dossierApprenantRouter from './routes/dossiers-apprenants.route';
import lienPriveCfaRouter from './routes/lien-prive-cfa.route';
import loginRouter from './routes/login.route';
import loginCfaRouter from './routes/login-cfa.route';
import configRouter from './routes/config.route';
import referentielRouter from './routes/referentiel.route';
import effectifsRouter from './routes/effectifs.route';
import effecitfsExportRouter from './routes/effectifs-export.route';
import cfasRouter from './routes/cfas.route';
import formationRouter from './routes/formations.route';
import healthcheckRouter from './routes/healthcheck.route';
import demandeIdentifiantsRouter from './routes/demande-identifiants.route';
import demandeBranchementErpRouter from './routes/demande-branchement-erp.route';
import cacheRouter from './routes/cache.route';
import updatePasswordRouter from './routes/update-password.route';
import usersRouter from './routes/users.route';
import reseauxCfasRouter from './routes/reseaux-cfas.route';
import effectifsNationalRouter from './routes/effectifs-national.route';

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
