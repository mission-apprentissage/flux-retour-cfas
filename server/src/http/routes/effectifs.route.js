import express from 'express';
import { format } from 'date-fns';
import tryCatch from '../middlewares/tryCatchMiddleware';
import Joi from 'joi';
import { getAnneesScolaireListFromDate } from '../../common/utils/anneeScolaireUtils';
import { tdbRoles } from '../../common/roles';
import validateRequestQuery from '../middlewares/validateRequestQuery';
import { getCacheKeyForRoute } from '../../common/utils/cacheUtils';

const filterQueryForNetworkRole = (req) => {
  if (req.user?.permissions.includes(tdbRoles.network)) {
    req.query.etablissement_reseaux = req.user.network;
  }
};

const filterQueryForCfaRole = (req) => {
  if (req.user?.permissions.includes(tdbRoles.cfa)) {
    req.query.uai_etablissement = req.user?.username;
  }
};

const applyUserRoleFilter = (req, _res, next) => {
  // users with network role should not be able to see data for other reseau
  filterQueryForNetworkRole(req);

  // users with cfa role should not be able to see data for other cfas
  filterQueryForCfaRole(req);

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

export default ({ stats, effectifs, cache }) => {
  const router = express.Router();

  /**
   * Gets nb organismes formation
   */
  router.get(
    "/total-organismes",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      const nbOrganismes = await stats.getNbDistinctCfasByUai(filters);

      return res.json({
        nbOrganismes,
      });
    })
  );

  /**
   * Gets the effectifs count for input period & query
   */
  router.get(
    "/",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      // Gets & format params:
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const response = {
          date,
          apprentis: await effectifs.apprentis.getCountAtDate(date, filters),
          rupturants: await effectifs.rupturants.getCountAtDate(date, filters),
          inscritsSansContrat: await effectifs.inscritsSansContrats.getCountAtDate(date, filters),
          abandons: await effectifs.abandons.getCountAtDate(date, filters),
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
    "/niveau-formation",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParNiveauFormation = await effectifs.getEffectifsCountByNiveauFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParNiveauFormation));
        return res.json(effectifsParNiveauFormation);
      }
    })
  );

  /**
   * Get effectifs details by formation_cfd
   */
  router.get(
    "/formation",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        niveau_formation: Joi.string().allow(null, ""),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParFormation = await effectifs.getEffectifsCountByFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParFormation));
        return res.json(effectifsParFormation);
      }
    })
  );

  /**
   * Get effectifs details by annee_formation
   */
  router.get(
    "/annee-formation",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParAnneeFormation = await effectifs.getEffectifsCountByAnneeFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParAnneeFormation));

        return res.json(effectifsParAnneeFormation);
      }
    })
  );

  /**
   * Get effectifs details by cfa
   */
  router.get(
    "/cfa",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsByCfaAtDate = await effectifs.getEffectifsCountByCfaAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsByCfaAtDate));

        return res.json(effectifsByCfaAtDate);
      }
    })
  );

  /**
   * Get effectifs details by siret
   */
  router.get(
    "/siret",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsBySiretAtDate = await effectifs.getEffectifsCountBySiretAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsBySiretAtDate));

        return res.json(effectifsBySiretAtDate);
      }
    })
  );

  /**
   * Get effectifs details by departement
   */
  router.get(
    "/departement",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsByDepartementAtDate = await effectifs.getEffectifsCountByDepartementAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsByDepartementAtDate));
        return res.json(effectifsByDepartementAtDate);
      }
    })
  );

  return router;
};
