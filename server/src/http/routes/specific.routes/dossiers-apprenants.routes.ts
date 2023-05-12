import express from "express";
import Joi from "joi";

import logger from "@/common/logger";
import { effectifsQueueDb, effectifsV3QueueDb } from "@/common/model/collections";
import { defaultValuesEffectifQueue } from "@/common/model/effectifsQueue.model";
import { formatError } from "@/common/utils/errorUtils";
import dossierApprenantSchemaV1V2 from "@/common/validation/dossierApprenantSchemaV1V2";
import dossierApprenantSchemaV3 from "@/common/validation/dossierApprenantSchemaV3";

const POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH = 100;

export default () => {
  const router = express.Router();

  /**
   * Route post for DossierApprenant
   * Une prévalidation des données est effectuée, afin de faire un retour immédiat à l'utilisateur
   * Une validation plus complete est effectuée lors du traitement des données par process-effectifs-queue
   */
  router.post("/", async ({ user, body, originalUrl }, res) => {
    const bodyItems = await Joi.array()
      .max(POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH)
      .validateAsync(body, { abortEarly: false });

    const isV3 = originalUrl.includes("/v3");
    const collection = (isV3 ? effectifsV3QueueDb() : effectifsQueueDb()) as any;
    const validationSchema = isV3 ? dossierApprenantSchemaV3() : dossierApprenantSchemaV1V2();

    const source = user.username;
    const effectifsToQueue = bodyItems.map((dossierApprenant) => {
      const result = validationSchema.safeParse({
        source,
        ...dossierApprenant,
      });
      const prettyValidationError = result.success
        ? undefined
        : result.error.issues.map(({ path, message }) => ({ message, path }));

      return {
        source,
        ...dossierApprenant,
        ...defaultValuesEffectifQueue(),
        ...(prettyValidationError ? { processed_at: new Date() } : {}),
        validation_errors: prettyValidationError || [],
      };
    });

    try {
      if (effectifsToQueue.length === 1) {
        await collection.insertOne(effectifsToQueue[0]);
      } else if (effectifsToQueue.length) {
        await collection.insertMany(effectifsToQueue);
      }
      res.json({
        status: "OK",
        message: "Queued",
        detail: effectifsToQueue.some((effectif) => effectif.validation_errors?.length)
          ? "Some data are invalid"
          : undefined,
        data: effectifsToQueue,
      });
    } catch (e: any) {
      const err = formatError(e);
      logger.error({ err }, "POST /dossiers-apprenants error");

      res.status(500).json({
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
