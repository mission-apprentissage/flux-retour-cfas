import express from "express";
import { format } from "date-fns";
import Joi from "joi";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import { getAnneesScolaireListFromDate } from "../../../../common/utils/anneeScolaireUtils.js";
import { getCacheKeyForRoute } from "../../../../common/utils/cacheUtils.js";
import { getNbDistinctOrganismesByUai } from "../../../../common/actions/dossiersApprenants.actions.js";

export default ({ effectifs, cache }) => {
  const router = express.Router();
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const { date: dateFromQuery } = await Joi.object({
        date: Joi.date().required(),
      }).validateAsync(req.query, { abortEarly: false });

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
        totalOrganismes: await getNbDistinctOrganismesByUai(filters),
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
