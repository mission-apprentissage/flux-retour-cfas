const express = require("express");
const config = require("config");
const bodyParser = require("body-parser");
const packageJson = require("../../package.json");
const logger = require("../common/logger");

const { apiStatutsSeeder, administrator } = require("../common/roles");

const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const tryCatch = require("./middlewares/tryCatchMiddleware");
const apiKeyPermissionsAuthMiddleware = require("./middlewares/apiKeyPermissionsAuthMiddleware");
const corsMiddleware = require("./middlewares/corsMiddleware");
const authMiddleware = require("./middlewares/authMiddleware");
const permissionsMiddleware = require("./middlewares/permissionsMiddleware");

const statutCandidatsRoute = require("./routes/statut-candidats");
const loginRoute = require("./routes/login");
const adminRoute = require("./routes/admin");
const passwordRoute = require("./routes/password");
const statsRoute = require("./routes/stats");
const configRoute = require("./routes/config");

module.exports = async (components) => {
  const { db } = components;
  const app = express();

  const checkJwtToken = authMiddleware(components);
  const adminOnly = permissionsMiddleware([administrator]);
  const apiStatutSeedersOnly = apiKeyPermissionsAuthMiddleware([apiStatutsSeeder]);

  app.use(bodyParser.json());
  app.use(corsMiddleware());
  app.use(logMiddleware());

  app.use("/api/statut-candidats", apiStatutSeedersOnly, statutCandidatsRoute(components));
  app.use("/api/login", loginRoute(components));
  app.use("/api/admin", checkJwtToken, adminOnly, adminRoute());
  app.use("/api/password", passwordRoute(components));
  app.use("/api/stats", checkJwtToken, adminOnly, statsRoute(components));
  app.use("/api/config", checkJwtToken, adminOnly, configRoute());

  app.get(
    "/api",
    tryCatch(async (req, res) => {
      let mongodbStatus;
      await db
        .collection("statutsCandidats")
        .stats()
        .then(() => {
          mongodbStatus = true;
        })
        .catch((e) => {
          mongodbStatus = false;
          logger.error("Healthcheck failed", e);
        });

      return res.json({
        name: `Serveur MNA - ${config.appName}`,
        version: packageJson.version,
        env: config.env,
        healthcheck: {
          mongodb: mongodbStatus,
        },
      });
    })
  );

  app.use(errorMiddleware());

  return app;
};
