import express from "express";
import Joi from "joi";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { getAnneesScolaireListFromDate } from "../../../common/utils/anneeScolaireUtils.js";
import { getNbDistinctOrganismesByUai } from "../../../common/actions/dossiersApprenants.actions.js";
import { ObjectId } from "mongodb";

const commonEffectifsFilters = {
  organisme_id: Joi.string().required(),
  // etablissement_num_region: Joi.string().allow(null, ""),
  // etablissement_num_departement: Joi.string().allow(null, ""),
  formation_cfd: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
};

export default ({ effectifs }) => {
  const router = express.Router();

  /**
   * Gets nb organismes formation
   */
  router.get(
    "/total-organismes",
    tryCatch(async (req, res) => {
      const { date: dateFromQuery, ...filtersFromBody } = await Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      }).validateAsync(req.query, { abortEarly: false });

      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      const nbOrganismes = await getNbDistinctOrganismesByUai(filters);

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
    tryCatch(async (req, res) => {
      const {
        date: dateFromParams,
        organisme_id,
        ...filtersFromBody
      } = await Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      }).validateAsync(req.query, { abortEarly: false });

      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        organisme_id: ObjectId(organisme_id),
        annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
      };

      const response = {
        date,
        apprentis: await effectifs.apprentis.getCountAtDate(date, filters),
        rupturants: await effectifs.rupturants.getCountAtDate(date, filters),
        inscritsSansContrat: await effectifs.inscritsSansContrats.getCountAtDate(date, filters),
        abandons: await effectifs.abandons.getCountAtDate(date, filters),
      };

      return res.json(response);
    })
  );

  /**
   * Get effectifs details by niveau_formation
   */
  // router.get(
  //   "/niveau-formation",
  //   tryCatch(async (req, res) => {
  //     const {
  //       date: dateFromParams, // eslint-disable-next-line no-unused-vars
  //       organisme_id,
  //       ...filtersFromBody
  //     } = await Joi.object({
  //       date: Joi.date().required(),
  //       ...commonEffectifsFilters,
  //     }).validateAsync(req.query, { abortEarly: false });

  //     const date = new Date(dateFromParams);
  //     const filters = {
  //       ...filtersFromBody,
  //       annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
  //     };

  //     // try to retrieve from cache
  //     const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
  //       date: format(date, "yyyy-MM-dd"),
  //       filters,
  //     });
  //     const fromCache = await cache.get(cacheKey);

  //     if (fromCache) {
  //       return res.json(JSON.parse(fromCache));
  //     } else {
  //       const effectifsParNiveauFormation = await effectifs.getEffectifsCountByNiveauFormationAtDate(date, filters);
  //       await cache.set(cacheKey, JSON.stringify(effectifsParNiveauFormation));
  //       return res.json(effectifsParNiveauFormation);
  //     }
  //   })
  // );

  /**
   * Get effectifs details by formation_cfd
   */
  // router.get(
  //   "/formation",
  //   tryCatch(async (req, res) => {
  //     const {
  //       date: dateFromParams, // eslint-disable-next-line no-unused-vars
  //       organisme_id,
  //       ...filtersFromBody
  //     } = await Joi.object({
  //       date: Joi.date().required(),
  //       niveau_formation: Joi.string().allow(null, ""),
  //       ...commonEffectifsFilters,
  //     }).validateAsync(req.query, { abortEarly: false });

  //     const date = new Date(dateFromParams);
  //     const filters = {
  //       ...filtersFromBody,
  //       annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
  //     };

  //     // try to retrieve from cache
  //     const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
  //       date: format(date, "yyyy-MM-dd"),
  //       filters,
  //     });
  //     const fromCache = await cache.get(cacheKey);

  //     if (fromCache) {
  //       return res.json(JSON.parse(fromCache));
  //     } else {
  //       const effectifsParFormation = await effectifs.getEffectifsCountByFormationAtDate(date, filters);
  //       await cache.set(cacheKey, JSON.stringify(effectifsParFormation));
  //       return res.json(effectifsParFormation);
  //     }
  //   })
  // );

  /**
   * Get effectifs details by annee_formation
   */
  // router.get(
  //   "/annee-formation",
  //   tryCatch(async (req, res) => {
  //     const {
  //       date: dateFromParams, // eslint-disable-next-line no-unused-vars
  //       organisme_id,
  //       ...filtersFromBody
  //     } = await Joi.object({
  //       date: Joi.date().required(),
  //       niveau_formation: Joi.string().allow(null, ""),
  //       ...commonEffectifsFilters,
  //     }).validateAsync(req.query, { abortEarly: false });

  //     const date = new Date(dateFromParams);
  //     const filters = {
  //       ...filtersFromBody,
  //       annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
  //     };

  //     // try to retrieve from cache
  //     const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
  //       date: format(date, "yyyy-MM-dd"),
  //       filters,
  //     });
  //     const fromCache = await cache.get(cacheKey);

  //     if (fromCache) {
  //       return res.json(JSON.parse(fromCache));
  //     } else {
  //       const effectifsParAnneeFormation = await effectifs.getEffectifsCountByAnneeFormationAtDate(date, filters);
  //       await cache.set(cacheKey, JSON.stringify(effectifsParAnneeFormation));

  //       return res.json(effectifsParAnneeFormation);
  //     }
  //   })
  // );

  /**
   * Get effectifs details by cfa
   */
  // router.get(
  //   "/cfa",
  //   tryCatch(async (req, res) => {
  //     const {
  //       date: dateFromQuery, // eslint-disable-next-line no-unused-vars
  //       organisme_id,
  //       ...filtersFromBody
  //     } = await Joi.object({
  //       date: Joi.date().required(),
  //       ...commonEffectifsFilters,
  //     }).validateAsync(req.query, { abortEarly: false });

  //     const date = new Date(dateFromQuery);
  //     const filters = {
  //       ...filtersFromBody,
  //       annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
  //     };

  //     // try to retrieve from cache
  //     const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
  //       date: format(date, "yyyy-MM-dd"),
  //       filters,
  //     });
  //     const fromCache = await cache.get(cacheKey);

  //     if (fromCache) {
  //       return res.json(JSON.parse(fromCache));
  //     } else {
  //       const effectifsByCfaAtDate = await effectifs.getEffectifsCountByCfaAtDate(date, filters);
  //       await cache.set(cacheKey, JSON.stringify(effectifsByCfaAtDate));

  //       return res.json(effectifsByCfaAtDate);
  //     }
  //   })
  // );

  /**
   * Get effectifs details by siret
   */
  // router.get(
  //   "/siret",
  //   tryCatch(async (req, res) => {
  //     const {
  //       date: dateFromQuery, // eslint-disable-next-line no-unused-vars
  //       organisme_id,
  //       ...filtersFromBody
  //     } = await Joi.object({
  //       date: Joi.date().required(),
  //       ...commonEffectifsFilters,
  //     }).validateAsync(req.query, { abortEarly: false });

  //     const date = new Date(dateFromQuery);
  //     const filters = {
  //       ...filtersFromBody,
  //       annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
  //     };

  //     // try to retrieve from cache
  //     const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
  //       date: format(date, "yyyy-MM-dd"),
  //       filters,
  //     });
  //     const fromCache = await cache.get(cacheKey);

  //     if (fromCache) {
  //       return res.json(JSON.parse(fromCache));
  //     } else {
  //       const effectifsBySiretAtDate = await effectifs.getEffectifsCountBySiretAtDate(date, filters);
  //       await cache.set(cacheKey, JSON.stringify(effectifsBySiretAtDate));

  //       return res.json(effectifsBySiretAtDate);
  //     }
  //   })
  // );

  /**
   * Get effectifs details by departement
   */
  // router.get(
  //   "/departement",
  //   tryCatch(async (req, res) => {
  //     const {
  //       date: dateFromQuery, // eslint-disable-next-line no-unused-vars
  //       organisme_id,
  //       ...filtersFromBody
  //     } = await Joi.object({
  //       date: Joi.date().required(),
  //       ...commonEffectifsFilters,
  //     }).validateAsync(req.query, { abortEarly: false });

  //     const date = new Date(dateFromQuery);
  //     const filters = {
  //       ...filtersFromBody,
  //       annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
  //     };

  //     // try to retrieve from cache
  //     const cacheKey = getCacheKeyForRoute(`${req.baseUrl}${req.path}`, {
  //       date: format(date, "yyyy-MM-dd"),
  //       filters,
  //     });
  //     const fromCache = await cache.get(cacheKey);

  //     if (fromCache) {
  //       return res.json(JSON.parse(fromCache));
  //     } else {
  //       const effectifsByDepartementAtDate = await effectifs.getEffectifsCountByDepartementAtDate(date, filters);
  //       await cache.set(cacheKey, JSON.stringify(effectifsByDepartementAtDate));
  //       return res.json(effectifsByDepartementAtDate);
  //     }
  //   })
  // );

  return router;
};
