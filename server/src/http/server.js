const express = require("express");
const bodyParser = require("body-parser");

const { apiStatutsSeeder, administrator } = require("../common/roles");

const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const corsMiddleware = require("./middlewares/corsMiddleware");
const jwtAuthMiddleware = require("./middlewares/jwtAuthMiddleware");
const permissionsMiddleware = require("./middlewares/permissionsMiddleware");

const statutCandidatsRoute = require("./routes/statut-candidats");
const loginRoute = require("./routes/login");
const statsRoute = require("./routes/stats");
const userEventsRoute = require("./routes/userEvents");
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

  app.use(
    "/api/statut-candidats",
    jwtAuthMiddleware(components),
    permissionsMiddleware([apiStatutsSeeder]),
    statutCandidatsRoute(components)
  );
  app.use("/api/login", loginRoute(components));
  app.use("/api/stats", checkJwtToken, statsRoute(components));
  app.use("/api/formations", formationRoutes(components));
  app.use("/api/cfas", cfasRoute(components));
  app.use("/api/userEvents", checkJwtToken, adminOnly, userEventsRoute(components));
  app.use("/api/config", checkJwtToken, adminOnly, configRoute());
  app.use("/api/referentiel", referentielRoute());
  app.use("/api/dashboard", dashboardRoute(components));
  app.use("/api/healthcheck", healthcheckRoute(components));

  app.use(errorMiddleware());

  return app;
};
