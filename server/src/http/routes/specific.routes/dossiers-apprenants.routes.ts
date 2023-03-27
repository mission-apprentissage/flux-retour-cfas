import express from "express";
import Joi from "joi";

import logger from "../../../common/logger.js";
import { effectifsQueueDb } from "../../../common/model/collections.js";
import { defaultValuesEffectifQueue } from "../../../common/model/effectifsQueue.model.js";
import dossierApprenantSchema from "../../../common/validation/dossierApprenantSchema.js";

const POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH = 100;

export default () => {
  const router = express.Router();

  /**
   * Route post for DossierApprenant
   * Une prévalidation des données est effectuée, afin de faire un retour immédiat à l'utilisateur
   * Une validation plus complete est effectuée lors du traitement des données par process-effectifs-queue
   */
  router.post("/", async ({ user, body }, res) => {
    const effectifsToQueue = (
      await Joi.array().max(POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH).validateAsync(body, { abortEarly: false })
    ).map((dossierApprenant) => {
      const validation_errors = dossierApprenantSchema.validate(dossierApprenant, {
        allowUnknown: true,
        abortEarly: false,
      })?.error;
      return {
        ...dossierApprenant,
        ...defaultValuesEffectifQueue(),
        source: user.username,
        ...(validation_errors ? { process_at: new Date() } : {}),
        validation_errors: validation_errors || [],
      };
    });

    try {
      if (effectifsToQueue.length) {
        await effectifsQueueDb().insertMany(effectifsToQueue);
      }
      res.json({
        status: "OK",
        message: "Queued",
        detail: effectifsToQueue.some((effectif) => effectif.validation_errors.length)
          ? "Some data are invalid"
          : undefined,
        data: effectifsToQueue,
      });
    } catch (err: any) {
      logger.error(`POST /dossiers-apprenants error : ${err.toString()}`);
      res.status(400).json({
        status: "ERROR",
        message: err.message,
      });
    }
  });

  /**
   * Test route for dossiers-apprenants
   */
  router.post("/test", async (_req, res) => {
    return res.json({ msg: "ok" });
  });

  return router;
};
