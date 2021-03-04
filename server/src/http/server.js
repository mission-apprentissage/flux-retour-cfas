const express = require("express");
const bodyParser = require("body-parser");

const { apiStatutsSeeder, administrator } = require("../common/roles");

const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const corsMiddleware = require("./middlewares/corsMiddleware");
const jwtAuthMiddleware = require("./middlewares/jwtAuthMiddleware");
const permissionsMiddleware = require("./middlewares/permissionsMiddleware");
const apiKeyOrJwtAuthMiddleware = require("./middlewares/apiKeyOrJwtAuthMiddleware");

const statutCandidatsRoute = require("./routes/statut-candidats");
const loginRoute = require("./routes/login");
const statsRoute = require("./routes/stats");
const userEventsRoute = require("./routes/userEvents");
const analyticsRoute = require("./routes/analytics");
const configRoute = require("./routes/config");
const referentielRoute = require("./routes/referentiel");
const dashboardRoute = require("./routes/dashboard");
const cfasRoute = require("./routes/cfas");
const formationRoutes = require("./routes/formations");
const healthcheckRoute = require("./routes/healthcheck");

module.exports = async (components) => {
  const app = express();

  const checkJwtToken = jwtAuthMiddleware(components);
  const adminOnly = permissionsMiddleware([administrator]);

  app.use(bodyParser.json());
  app.use(corsMiddleware());
  app.use(logMiddleware());

  // temporarily support auth with jwt or apiKey while Ymag clients upgrade their strategy
  app.use(
    "/api/statut-candidats",
    apiKeyOrJwtAuthMiddleware(components),
    permissionsMiddleware([apiStatutsSeeder]),
    statutCandidatsRoute(components)
  );
  app.use("/api/login", loginRoute(components));
  app.use("/api/stats", checkJwtToken, statsRoute(components));
  app.use("/api/formations", formationRoutes());
  app.use("/api/cfas", cfasRoute(components));
  app.use("/api/userEvents", checkJwtToken, userEventsRoute(components));
  app.use("/api/analytics", checkJwtToken, analyticsRoute(components));
  app.use("/api/config", checkJwtToken, adminOnly, configRoute());
  app.use("/api/referentiel", checkJwtToken, adminOnly, referentielRoute());
  app.use("/api/dashboard", dashboardRoute(components));
  app.use("/api/healthcheck", healthcheckRoute(components));

  app.use(errorMiddleware());

  return app;
};
