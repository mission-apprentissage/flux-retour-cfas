import tryCatch from "../middlewares/tryCatchMiddleware.js";
import express from "express";
import { getAnneesScolaireListFromDate } from "../../common/utils/anneeScolaireUtils.js";
import { format } from "date-fns";
import { getCacheKeyForRoute } from "../../common/utils/cacheUtils.js";
import validateRequestQuery from "../middlewares/validateRequestQuery.js";
import Joi from "joi";

export default ({ stats, effectifs, cache }) => {
  const router = express.Router();
  router.get(
    "/",
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromQuery } = req.query;
      const date = new Date(dateFromQuery);
      const filters = { annee_scolaire: { $in: getAnneesScolaireListFromDate(date) } };
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) return res.json(JSON.parse(fromCache));

      const response = {
        date,
        totalOrganismes: await stats.getNbDistinctCfasByUai(filters),
        apprentis: await effectifs.apprentis.getCountAtDate(date, filters),
        rupturants: await effectifs.rupturants.getCountAtDate(date, filters),
        inscritsSansContrat: await effectifs.inscritsSansContrats.getCountAtDate(date, filters),
        abandons: await effectifs.abandons.getCountAtDate(date, filters),
      };

      await cache.set(cacheKey, JSON.stringify(response));
      return res.json(response);
    })
  );
  return router;
};
