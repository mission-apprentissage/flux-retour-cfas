import express from "express";

import { dateFiltersSchema } from "@/common/actions/helpers/filters";
import { getEffectifIndicateursForMissionLocaleId } from "@/common/actions/indicateurs/indicateurs-mission-locale";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/indicateurs", returnResult(getIndicateursMissionLocale));
  return router;
};

const getIndicateursMissionLocale = async (req, { locals }) => {
  const { missionLocale } = locals;
  const filters = await validateFullZodObjectSchema(req.query, dateFiltersSchema);
  return await getEffectifIndicateursForMissionLocaleId(filters, missionLocale._id);
};
