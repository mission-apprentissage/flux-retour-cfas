import { captureException } from "@sentry/node";
import express from "express";
import Joi from "joi";
import { ObjectId } from "mongodb";

import { updateOrganisme } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";
import { defaultValuesEffectifQueue } from "@/common/model/effectifsQueue.model";
import { formatError } from "@/common/utils/errorUtils";
import stripNullProperties from "@/common/utils/stripNullProperties";
import dossierApprenantSchemaV1V2 from "@/common/validation/dossierApprenantSchemaV1V2";
import { dossierApprenantSchemaV3Input, stripModelAdditionalKeys } from "@/common/validation/dossierApprenantSchemaV3";

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
    const v2Schema = dossierApprenantSchemaV1V2();
    const v3Schema = dossierApprenantSchemaV3Input();
    const validationSchema = isV3 ? v3Schema : v2Schema;

    const source = user.username || user.source;
    const effectifsToQueue = bodyItems.map((dossierApprenant) => {
      const result = validationSchema.safeParse({
        ...dossierApprenant,
        source,
      });
      const prettyValidationError = result.success
        ? undefined
        : result.error.issues.map(({ path, message }) => ({ message, path }));

      // Suppression des données additionnelles envoyé dans le body
      const cleansedData = stripModelAdditionalKeys(validationSchema, dossierApprenant);

      // Nous ne pouvons pas garder le `nir_apprenant` en base
      const { nir_apprenant, ...rest } = cleansedData;

      return {
        ...rest,
        has_nir: Boolean(nir_apprenant),
        ...defaultValuesEffectifQueue(),
        ...(prettyValidationError ? { processed_at: new Date() } : {}),
        validation_errors: prettyValidationError || [],
        source,
        ...(user.source_organisme_id ? { source_organisme_id: user.source_organisme_id } : {}),
        api_version: isV3 ? "v3" : "v2",
      };
    });

    try {
      if (isV3 && user.source_organisme_id) {
        // Si une erreur est détectée, on met à jour l'organisme pour indiquer qu'il y a des erreurs de transmission
        const hasError = effectifsToQueue.find((effectif) => effectif.validation_errors?.length);
        if (hasError) {
          await updateOrganisme(new ObjectId(user.source_organisme_id), {
            has_transmission_errors: true,
            transmission_errors_date: new Date(),
          });
        }
      }

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
