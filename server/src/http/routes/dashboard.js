const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent } = require("../../common/model");

module.exports = ({ stats, dashboard }) => {
  const router = express.Router();

  /**
   * Schema for effectif validation
   */
  const dashboardEffectifInputSchema = Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
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
  router.post(
    "/effectifs",
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardEffectifInputSchema.validateAsync(req.body, {
        abortEarly: false,
      });

      // Gets & format params:
      const { startDate: startDateFromBody, endDate: endDateFromBody, ...filters } = req.body;
      const startDate = new Date(startDateFromBody);
      const endDate = new Date(endDateFromBody);

      // Add user event
      const event = new UserEvent({
        username: "dashboard",
        type: "GET",
        action: "api/dashboard/effectifs",
        data: { startDate, endDate, filters },
      });
      await event.save();

      // Build response
      return res.json({
        date: endDate,
        apprentis: await dashboard.getApprentisCountAtDate(endDate, filters),
        rupturants: await dashboard.getRupturantsCountAtDate(endDate, filters),
        inscritsSansContrat: await dashboard.getInscritsSansContratCountAtDate(endDate, filters),
        abandons: await dashboard.getAbandonsCountAtDate(endDate, filters),
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
        etablissement_reseaux: Joi.string().allow(null, ""),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
      }).validateAsync(req.query, { abortEarly: false });

      const { date: dateFromBody, ...filters } = req.query;
      const date = new Date(dateFromBody);

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
        etablissement_reseaux: Joi.string().allow(null, ""),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
        niveau_formation: Joi.string().allow(null, ""),
      }).validateAsync(req.query, { abortEarly: false });

      const { date: dateFromBody, ...filters } = req.query;
      const date = new Date(dateFromBody);

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
        etablissement_reseaux: Joi.string().allow(null, ""),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
      }).validateAsync(req.query, { abortEarly: false });

      const { date: dateFromBody, ...filters } = req.query;
      const date = new Date(dateFromBody);

      const effectifsParAnneeFormation = await dashboard.getEffectifsCountByAnneeFormationAtDate(date, filters);

      return res.json(effectifsParAnneeFormation);
    })
  );

  router.post(
    "/effectifs-par-cfa",
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardEffectifsByCfaBodySchema.validateAsync(req.body, {
        abortEarly: false,
      });

      const { date: dateFromBody, ...filters } = req.body;
      const date = new Date(dateFromBody);

      const effectifsByCfaAtDate = await dashboard.getEffectifsCountByCfaAtDate(date, filters);

      return res.json(effectifsByCfaAtDate);
    })
  );

  router.post(
    "/effectifs-par-departement",
    tryCatch(async (req, res) => {
      await Joi.object({
        date: Joi.date().required(),
        etablissement_num_region: Joi.string().allow(null, ""),
      }).validateAsync(req.body, { abortEarly: false });
      const { date: dateFromBody, ...filters } = req.body;
      const date = new Date(dateFromBody);

      const effectifsByDepartementAtDate = await dashboard.getEffectifsCountByDepartementAtDate(date, filters);

      return res.json(effectifsByDepartementAtDate);
    })
  );

  router.post(
    "/chiffres-cles",
    tryCatch(async (req, res) => {
      // Validate schema
      await nouveauxContratsQueryBodySchema.validateAsync(req.body, {
        abortEarly: false,
      });

      const { startDate, endDate, ...filters } = req.body;
      const dateRange = [new Date(startDate), new Date(endDate)];

      const nouveauxContratsCountInDateRange = await dashboard.getNouveauxContratsCountInDateRange(dateRange, filters);
      const rupturesCountInDateRange = await dashboard.getNbRupturesContratAtDate(dateRange[1], filters);

      return res.json({ nbContrats: nouveauxContratsCountInDateRange, nbRuptures: rupturesCountInDateRange });
    })
  );

  return router;
};
