import express from 'express';
import logger from '../../common/logger';
import config from '../../../config';
import tryCatch from '../middlewares/tryCatchMiddleware';
import packageJson from '../../../package.json';

export default ({ db }) => {
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
