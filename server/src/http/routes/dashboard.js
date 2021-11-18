const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent } = require("../../common/model");
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

module.exports = ({ stats, dashboard }) => {
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

      // Add user event
      const event = new UserEvent({
        username: "dashboard",
        type: "GET",
        action: "api/dashboard/effectifs",
        data: { date, filters },
      });
      await event.save();

      // Build response
      return res.json({
        date,
        apprentis: await dashboard.getApprentisCountAtDate(date, filters),
        rupturants: await dashboard.getRupturantsCountAtDate(date, filters),
        inscritsSansContrat: await dashboard.getInscritsSansContratCountAtDate(date, filters),
        abandons: await dashboard.getAbandonsCountAtDate(date, filters),
      });
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

      const effectifsParNiveauFormation = await dashboard.getEffectifsCountByNiveauFormationAtDate(date, filters);

      return res.json(effectifsParNiveauFormation);
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

      const effectifsParFormation = await dashboard.getEffectifsCountByFormationAtDate(date, filters);

      return res.json(effectifsParFormation);
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

      const effectifsParAnneeFormation = await dashboard.getEffectifsCountByAnneeFormationAtDate(date, filters);

      return res.json(effectifsParAnneeFormation);
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

      const effectifsByCfaAtDate = await dashboard.getEffectifsCountByCfaAtDate(date, filters);

      return res.json(effectifsByCfaAtDate);
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
      const effectifsByDepartementAtDate = await dashboard.getEffectifsCountByDepartementAtDate(date, filters);

      return res.json(effectifsByDepartementAtDate);
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
