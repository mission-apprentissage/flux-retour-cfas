import express from "express";
import logger from "../../common/logger.js";
import config from "../../config.js";
import { packageJson } from "../../common/utils/esmUtils.js";
import { jobEventsDb } from "../../common/model/collections.js";

export default () => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    let mongodbStatus = false;

    try {
      await jobEventsDb();
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
  });

  return router;
};
