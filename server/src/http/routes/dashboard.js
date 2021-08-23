const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent } = require("../../common/model");
const { getAnneeScolaireFromDate } = require("../../common/utils/anneeScolaireUtils");

module.exports = ({ stats, dashboard }) => {
  const router = express.Router();

  /**
   * Schema for effectif validation
   */
  const dashboardEffectifInputSchema = Joi.object({
    date: Joi.date().required(),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    formation_cfd: Joi.string().allow(null, ""),
    uai_etablissement: Joi.string().allow(null, ""),
    siret_etablissement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  });

  /**
   * Schema for organismes count validation
   */
  const organismesCountInputSchema = Joi.object({
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    formation_cfd: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  });

  /**
   * Schema for effetctifs by CFA body
   */
  const dashboardEffectifsByCfaBodySchema = Joi.object({
    date: Joi.date().required(),
    formation_cfd: Joi.string().allow(null, ""),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  });

  /**
   * Schema for nouveaux contrats
   */
  const nouveauxContratsQueryBodySchema = Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    formation_cfd: Joi.string().allow(null, ""),
    uai_etablissement: Joi.string().allow(null, ""),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  });

  /**
   * Gets the general stats for the dashboard
   */
  router.get(
    "/etablissements-stats",
    tryCatch(async (req, res) => {
      // Add user event
      const event = new UserEvent({
        username: "dashboard",
        type: "GET",
        action: "api/dashboard/etablissements-stats",
        data: null,
      });
      await event.save();

      // Get nbEtablissement data
      const nbEtablissements = await stats.getNbDistinctCfasBySiret();

      // Return data
      return res.json({
        nbEtablissements,
      });
    })
  );

  /**
   * Gets region conversion stats
   */
  router.post(
    "/total-organismes",
    tryCatch(async (req, res) => {
      // Validate schema
      await organismesCountInputSchema.validateAsync(req.body, {
        abortEarly: false,
      });

      const nbOrganismes = await stats.getNbDistinctCfasByUai(req.body);

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
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardEffectifInputSchema.validateAsync(req.query, {
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
    tryCatch(async (req, res) => {
      await Joi.object({
        date: Joi.date().required(),
        uai_etablissement: Joi.string().allow(null, ""),
        siret_etablissement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
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
    tryCatch(async (req, res) => {
      await Joi.object({
        date: Joi.date().required(),
        uai_etablissement: Joi.string().allow(null, ""),
        siret_etablissement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
        niveau_formation: Joi.string().allow(null, ""),
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
    tryCatch(async (req, res) => {
      await Joi.object({
        date: Joi.date().required(),
        formation_cfd: Joi.string().allow(null, ""),
        uai_etablissement: Joi.string().allow(null, ""),
        siret_etablissement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
      }).validateAsync(req.query, { abortEarly: false });

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
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardEffectifsByCfaBodySchema.validateAsync(req.query, {
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
    tryCatch(async (req, res) => {
      await Joi.object({
        date: Joi.date().required(),
        etablissement_num_region: Joi.string().allow(null, ""),
      }).validateAsync(req.query, { abortEarly: false });

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
    tryCatch(async (req, res) => {
      // Validate schema
      await nouveauxContratsQueryBodySchema.validateAsync(req.query, {
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
