import express from "express";
import Joi from "joi";

import logger from "../../../common/logger.js";
import { findAndPaginate } from "../../../common/utils/dbUtils.js";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../../common/constants/userEventsConstants.js";
import { dossiersApprenantsMigrationDb, effectifsQueueDb } from "../../../common/model/collections.js";
import { sendTransformedPaginatedJsonStream } from "../../../common/utils/httpUtils.js";
import { createUserEvent } from "../../../common/actions/userEvents.actions.js";
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
   * Route get for DossierApprenant
   */
  router.get("/", async (req, res) => {
    const {
      page: reqPage,
      limit: reqLimit,
      ...filtersFromBody
    } = await Joi.object({
      page: Joi.number(),
      limit: Joi.number(),
      etablissement_num_region: Joi.string().allow(null, ""),
      etablissement_num_departement: Joi.string().allow(null, ""),
      formation_cfd: Joi.string().allow(null, ""),
      uai_etablissement: Joi.string().allow(null, ""),
      siret_etablissement: Joi.string().allow(null, ""),
      annee_scolaire: Joi.string().allow(null, ""),
    }).validateAsync(req.query, { abortEarly: false });

    const page = Number(reqPage ?? 1);
    const limit = Number(reqLimit ?? 1000);

    try {
      // Add user event
      await createUserEvent({
        username: req.user.username,
        type: USER_EVENTS_TYPES.GET,
        action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
        data: req.body,
      });

      // Gets paginated data filtered on source mapped to username
      const { find, pagination } = await findAndPaginate(
        dossiersApprenantsMigrationDb(),
        { ...filtersFromBody, source: req.user.username },
        { projection: { created_at: 0, updated_at: 0, _id: 0, __v: 0 }, page, limit: limit }
      );

      // Return JSON transformed Stream
      return sendTransformedPaginatedJsonStream(find.stream(), "dossiersApprenants", pagination, res);
    } catch (err) {
      logger.error(`GET DossierApprenants error : ${err}`);
      res.status(500).json({
        status: "ERROR",
        // @ts-ignore
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
