import express from "express";
import { format } from "date-fns";
import Joi from "joi";
import { getAnneesScolaireListFromDate } from "../../../common/utils/anneeScolaireUtils.js";
import { validateFullObjectSchema } from "../../../common/utils/validationUtils.js";
import { returnResult, tryCachedExecution } from "../../middlewares/helpers.js";
import { getIndicateurs, getNbDistinctOrganismes } from "../../../common/actions/effectifs/effectifs.actions.js";

export default ({ cache }) => {
  const router = express.Router();
  router.get(
    "/",
    returnResult(async (req) => {
      const { date } = await validateFullObjectSchema(req.query, {
        date: Joi.date().required(),
      });
      const filters = { annee_scolaire: { $in: getAnneesScolaireListFromDate(date) } };
      const cacheKey = `${req.baseUrl}${req.path}:${format(date, "yyyy-MM-dd")}`;
      return tryCachedExecution(cache, cacheKey, async () => {
        const [indicateurs, totalOrganismes] = await Promise.all([
          getIndicateurs({ date }),
          getNbDistinctOrganismes(filters),
        ]);
        indicateurs.totalOrganismes = totalOrganismes;
        return indicateurs;
      });
    })
  );
  return router;
};
