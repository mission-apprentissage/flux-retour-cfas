const express = require("express");
const config = require("config");
const logger = require("../common/logger");
const { apiStatutsSeeder, administrator } = require("../common/roles");
const bodyParser = require("body-parser");
const logMiddleware = require("./middlewares/logMiddleware");
const errorMiddleware = require("./middlewares/errorMiddleware");
const tryCatch = require("./middlewares/tryCatchMiddleware");
const apiKeySimpleAuthMiddleware = require("./middlewares/apiKeySimpleAuthMiddleware");
const apiKeyPermissionsAuthMiddleware = require("./middlewares/apiKeyPermissionsAuthMiddleware");
const corsMiddleware = require("./middlewares/corsMiddleware");
const authMiddleware = require("./middlewares/authMiddleware");
const permissionsMiddleware = require("./middlewares/permissionsMiddleware");
const packageJson = require("../../package.json");
const apiSecured = require("./routes/api-secured");
const statutCandidats = require("./routes/statut-candidats");
const login = require("./routes/login");
const admin = require("./routes/admin");
const password = require("./routes/password");
const stats = require("./routes/stats");

module.exports = async (components) => {
  const { db } = components;
  const app = express();
  const checkJwtToken = authMiddleware(components);

  const adminOnly = permissionsMiddleware([administrator]);
  const apiStatutSeedersOnly = apiKeyPermissionsAuthMiddleware([apiStatutsSeeder]);

  app.use(bodyParser.json());
  app.use(corsMiddleware());
  app.use(logMiddleware());

  app.use("/api/api-secured", apiKeySimpleAuthMiddleware, apiSecured());
  app.use("/api/statut-candidats", apiStatutSeedersOnly, statutCandidats());

  app.use("/api/login", login(components));
  app.use("/api/admin", checkJwtToken, adminOnly, admin());
  app.use("/api/password", password(components));
  app.use("/api/stats", checkJwtToken, adminOnly, stats(components));

  app.get(
    "/api",
    tryCatch(async (req, res) => {
      let mongodbStatus;
      await db
        .collection("sampleEntity")
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

  app.get(
    "/api/config",
    tryCatch(async (req, res) => {
      return res.json({
        config: config,
      });
    })
  );

  app.use(errorMiddleware());

  return app;
};
