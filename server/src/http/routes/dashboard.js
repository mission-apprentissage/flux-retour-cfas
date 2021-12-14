const express = require("express");
const stringify = require("json-stringify-deterministic");
const { format } = require("date-fns");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { getAnneeScolaireFromDate } = require("../../common/utils/anneeScolaireUtils");
const { tdbRoles } = require("../../common/roles");

const applyUserRoleFilter = (req, _res, next) => {
  // users with network role should not be able to see data for other reseau
  if (req.user?.permissions.includes(tdbRoles.network)) {
    req.query.etablissement_reseaux = req.user.network;
  }
  // users with cfa role should not be able to see data for other cfas
  if (req.user?.permissions.includes(tdbRoles.cfa)) {
    req.query.uai_etablissement = req.user?.username;
  }
  next();
};

const commonEffectifsFilters = {
  etablissement_num_region: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  formation_cfd: Joi.string().allow(null, ""),
  uai_etablissement: Joi.string().allow(null, ""),
  siret_etablissement: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
};

const getCacheKeyForRoute = (route, filters) => {
  // we use json-stringify-deterministic to make sure that {a: 1, b: 2} stringified is the same as {b: 2, a: 1}
  return `${route}:${stringify(filters)}`;
};

module.exports = ({ stats, dashboard, cache }) => {
  const router = express.Router();

  /**
   * Gets region conversion stats
   */
  router.get(
    "/total-organismes",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      // Validate schema
      await Joi.object(commonEffectifsFilters).validateAsync(req.query, {
        abortEarly: false,
      });

      const nbOrganismes = await stats.getNbDistinctCfasByUai(req.query);

      return res.json({
        nbOrganismes,
      });
    })
  );

  /**
   * Gets the effectifs data for input period & query
   */
  router.get(
    "/effectifs",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      // Validate schema
      const validationSchema = Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      });
      await validationSchema.validateAsync(req.query, {
        abortEarly: false,
      });

      // Gets & format params:
      // eslint-disable-next-line no-unused-vars
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const response = {
          date,
          apprentis: await dashboard.getApprentisCountAtDate(date, filters),
          rupturants: await dashboard.getRupturantsCountAtDate(date, filters),
          inscritsSansContrat: await dashboard.getInscritsSansContratCountAtDate(date, filters),
          abandons: await dashboard.getAbandonsCountAtDate(date, filters),
        };
        // cache the result
        await cache.set(cacheKey, JSON.stringify(response));
        return res.json(response);
      }
    })
  );

  /**
   * Get effectifs details by niveau_formation
   */
  router.get(
    "/effectifs-par-niveau-formation",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      await Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      }).validateAsync(req.query, { abortEarly: false });

      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParNiveauFormation = await dashboard.getEffectifsCountByNiveauFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParNiveauFormation));
        return res.json(effectifsParNiveauFormation);
      }
    })
  );

  /**
   * Get effectifs details by formation_cfd
   */
  router.get(
    "/effectifs-par-formation",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      await Joi.object({
        date: Joi.date().required(),
        niveau_formation: Joi.string().allow(null, ""),
        ...commonEffectifsFilters,
      }).validateAsync(req.query, { abortEarly: false });

      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParFormation = await dashboard.getEffectifsCountByFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParFormation));
        return res.json(effectifsParFormation);
      }
    })
  );

  /**
   * Get effectifs details by annee_formation
   */
  router.get(
    "/effectifs-par-annee-formation",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      const validationSchema = Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      });
      await validationSchema.validateAsync(req.query, { abortEarly: false });

      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParAnneeFormation = await dashboard.getEffectifsCountByAnneeFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParAnneeFormation));

        return res.json(effectifsParAnneeFormation);
      }
    })
  );

  router.get(
    "/effectifs-par-cfa",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      // Validate schema
      const validationSchema = Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      });
      await validationSchema.validateAsync(req.query, {
        abortEarly: false,
      });

      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsByCfaAtDate = await dashboard.getEffectifsCountByCfaAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsByCfaAtDate));

        return res.json(effectifsByCfaAtDate);
      }
    })
  );

  router.get(
    "/effectifs-par-departement",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      const validationSchema = Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      });
      await validationSchema.validateAsync(req.query, { abortEarly: false });

      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsByDepartementAtDate = await dashboard.getEffectifsCountByDepartementAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsByDepartementAtDate));
        return res.json(effectifsByDepartementAtDate);
      }
    })
  );

  router.get(
    "/chiffres-cles",
    applyUserRoleFilter,
    tryCatch(async (req, res) => {
      // Validate schema
      const validationSchema = Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        ...commonEffectifsFilters,
      });
      await validationSchema.validateAsync(req.query, {
        abortEarly: false,
      });

      const { startDate, endDate, ...filters } = req.query;
      const dateRange = [new Date(startDate), new Date(endDate)];

      const nouveauxContratsCountInDateRange = await dashboard.getNouveauxContratsCountInDateRange(dateRange, filters);
      const rupturesCountInDateRange = await dashboard.getNbRupturesContratAtDate(dateRange[1], filters);

      return res.json({ nbContrats: nouveauxContratsCountInDateRange, nbRuptures: rupturesCountInDateRange });
    })
  );

  return router;
};
