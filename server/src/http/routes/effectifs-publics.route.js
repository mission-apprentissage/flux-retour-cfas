const tryCatch = require("../middlewares/tryCatchMiddleware");
const express = require("express");
const { getAnneesScolaireListFromDate } = require("../../common/utils/anneeScolaireUtils");
const { format } = require("date-fns");
const { getCacheKeyForRoute } = require("../../common/utils/cacheUtils");

module.exports = ({ stats, effectifs, cache }) => {
  const router = express.Router();
  router.get(
    "/",
    tryCatch(async (req, res) => {
      const date = new Date();
      const filters = { annee_scolaire: { $in: getAnneesScolaireListFromDate(date) } };
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) return res.json(JSON.parse(fromCache));

      const response = {
        date,
        totalOrganismes: await stats.getNbDistinctCfasByUai(req.query),
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
