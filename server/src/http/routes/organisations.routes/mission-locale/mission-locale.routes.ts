import express from "express";
import { IOrganisationMissionLocale } from "shared/models";

import { getPaginatedEffectifsByMissionLocaleId } from "@/common/actions/effectifs/effectifs.actions";
import { dateFiltersSchema } from "@/common/actions/helpers/filters";
import { getEffectifIndicateursForMissionLocaleId } from "@/common/actions/indicateurs/indicateurs-mission-locale";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/indicateurs", returnResult(getIndicateursMissionLocale));
  router.get("/effectifs", returnResult(getEffectifsMissionLocale));
  return router;
};

const getIndicateursMissionLocale = async (req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  const filters = await validateFullZodObjectSchema(req.query, dateFiltersSchema);
  return await getEffectifIndicateursForMissionLocaleId(filters, missionLocale.ml_id);
};

const getEffectifsMissionLocale = async (_req, { locals }) => {
  const missionLocale = locals.missionLocale as IOrganisationMissionLocale;
  return await getPaginatedEffectifsByMissionLocaleId(missionLocale.ml_id);
};
