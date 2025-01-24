import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { IOrganisationMissionLocale } from "shared/models";
import { effectifsFiltersMissionLocaleSchema } from "shared/models/routes/mission-locale/missionLocale.api";
import { withPaginationSchema } from "shared/models/routes/pagination";

import { dateFiltersSchema } from "@/common/actions/helpers/filters";
import {
  getEffectifIndicateursForMissionLocaleId,
  getPaginatedEffectifsByMissionLocaleId,
  setEffectifMissionLocaleData,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { updateMissionLocaleEffectifApi } from "@/common/apis/missions-locale/mission-locale.api";
import { effectifsDb } from "@/common/model/collections";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/indicateurs", returnResult(getIndicateursMissionLocale));
  router.get("/effectifs", returnResult(getEffectifsMissionLocale));
  router.post("/effectif", returnResult(updateEffectifMissionLocaleData));
  return router;
};

const getIndicateursMissionLocale = async (req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const filters = await validateFullZodObjectSchema(req.query, dateFiltersSchema);
  return await getEffectifIndicateursForMissionLocaleId(filters, missionLocale.ml_id);
};

const getEffectifsMissionLocale = async ({ query }, { locals }) => {
  const filters = await validateFullZodObjectSchema(query, withPaginationSchema(effectifsFiltersMissionLocaleSchema));
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  return await getPaginatedEffectifsByMissionLocaleId(missionLocale.ml_id, missionLocale._id, filters);
};

const updateEffectifMissionLocaleData = async ({ body }, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const data = await validateFullZodObjectSchema(body, updateMissionLocaleEffectifApi);

  const effectif = await effectifsDb().findOne({ _id: new ObjectId(data.effectif_id) });

  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }
  if (effectif.apprenant.adresse?.mission_locale_id?.toString() !== missionLocale.ml_id.toString()) {
    throw Boom.forbidden("Accès non autorisé");
  }
  return await setEffectifMissionLocaleData(missionLocale._id, data);
};
