import { captureException } from "@sentry/node";
import express from "express";
import Joi from "joi";

import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";
import { defaultValuesEffectifQueue } from "@/common/model/effectifsQueue.model";
import { formatError } from "@/common/utils/errorUtils";
import stripNullProperties from "@/common/utils/stripNullProperties";
import dossierApprenantSchemaV1V2 from "@/common/validation/dossierApprenantSchemaV1V2";
import dossierApprenantSchemaV3 from "@/common/validation/dossierApprenantSchemaV3";

const POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH = 2000;

export default () => {
  const router = express.Router();

  /**
   * Route post for DossierApprenant
   * Une prévalidation des données est effectuée, afin de faire un retour immédiat à l'utilisateur
   * Une validation plus complete est effectuée lors du traitement des données par process-effectifs-queue
   */
  router.post("/", async ({ user, body, originalUrl }, res) => {
    const bodyItems = (
      await Joi.array().max(POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH).validateAsync(body, { abortEarly: false })
    ).map((e) => stripNullProperties(e));
    const isV3 = originalUrl.includes("/v3");
    const validationSchema = isV3 ? dossierApprenantSchemaV3() : dossierApprenantSchemaV1V2();

    const source = user.username || user.source;
    const effectifsToQueue = bodyItems.map((dossierApprenant) => {
      const result = validationSchema.safeParse({
        ...dossierApprenant,
        source,
      });
      const prettyValidationError = result.success
        ? undefined
        : result.error.issues.map(({ path, message }) => ({ message, path }));

      return {
        ...dossierApprenant,
        ...defaultValuesEffectifQueue(),
        ...(prettyValidationError ? { processed_at: new Date() } : {}),
        validation_errors: prettyValidationError || [],
        source,
        ...(user.source_organisme_id ? { source_organisme_id: user.source_organisme_id } : {}),
        api_version: isV3 ? "v3" : "v2",
      };
    });

    try {
      if (effectifsToQueue.length === 1) {
        await effectifsQueueDb().insertOne(effectifsToQueue[0]);
      } else if (effectifsToQueue.length) {
        await effectifsQueueDb().insertMany(effectifsToQueue);
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
      captureException(new Error("POST /dossiers-apprenants error", { cause: err }));

      res.status(400).json({
        status: "ERROR",
        message: err.message,
        details: err.details,
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
