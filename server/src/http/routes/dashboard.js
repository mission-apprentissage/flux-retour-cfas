const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent } = require("../../common/model");
const { codesStatutsCandidats } = require("../../common/model/constants");

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
    siret_etablissement: Joi.string().allow(null, ""),
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

      const nbOrganismes = await stats.getNbDistinctCfasBySiret(req.body);

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

      // Gets effectif data for params
      const effectifsAtStartDate = await dashboard.getEffectifsCountByStatutApprenantAtDate(startDate, filters);
      const effectifsAtEndDate = await dashboard.getEffectifsCountByStatutApprenantAtDate(endDate, filters);

      // Build response
      return res.json([
        {
          date: startDate,
          apprentis: effectifsAtStartDate[codesStatutsCandidats.apprenti].count,
          inscrits: effectifsAtStartDate[codesStatutsCandidats.inscrit].count,
          abandons: effectifsAtStartDate[codesStatutsCandidats.abandon].count,
          abandonsProspects: effectifsAtStartDate[codesStatutsCandidats.abandonProspects].count,
        },
        {
          date: endDate,
          apprentis: effectifsAtEndDate[codesStatutsCandidats.apprenti].count,
          inscrits: effectifsAtEndDate[codesStatutsCandidats.inscrit].count,
          abandons: effectifsAtEndDate[codesStatutsCandidats.abandon].count,
          abandonsProspects: effectifsAtEndDate[codesStatutsCandidats.abandonProspects].count,
          dataConsistency: null,
        },
      ]);
    })
  );

  /**
   * Gets the dashboard cfa effectif detail
   */
  router.get(
    "/effectifs-par-niveau-et-annee-formation",
    tryCatch(async (req, res) => {
      await Joi.object({
        page: Joi.number().default(1),
        limit: Joi.number().default(10),
        date: Joi.date().required(),
        siret_etablissement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
      }).validateAsync(req.query, { abortEarly: false });

      const { date: dateFromBody, page, limit, ...filters } = req.query;
      const date = new Date(dateFromBody);

      // Checks if siret valid
      const effectifDetailCfaData = await dashboard.getPaginatedEffectifsParNiveauEtAnneeFormation(
        date,
        filters,
        page,
        limit
      );

      // Build response
      return res.json(effectifDetailCfaData);
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
    "/nouveaux-contrats",
    tryCatch(async (req, res) => {
      // Validate schema
      await nouveauxContratsQueryBodySchema.validateAsync(req.body, {
        abortEarly: false,
      });

      const { startDate, endDate, ...filters } = req.body;
      const dateRange = [new Date(startDate), new Date(endDate)];

      const nouveauxContratsCountInDateRange = await dashboard.getNouveauxContratsCountInDateRange(dateRange, filters);

      return res.json({ count: nouveauxContratsCountInDateRange });
    })
  );

  return router;
};
