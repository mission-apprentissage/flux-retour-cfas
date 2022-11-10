const express = require("express");
const logger = require("../../common/logger");
const config = require("../../../config");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const packageJson = require("../../../package.json");

module.exports = ({ db }) => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      let mongodbStatus = false;

      try {
        await db.stats();
        mongodbStatus = true;
      } catch (e) {
        logger.error("Healthcheck failed", e);
      }

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

  return router;
};
