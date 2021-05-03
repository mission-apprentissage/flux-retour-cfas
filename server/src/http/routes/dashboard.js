const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent, StatutCandidat, Cfa } = require("../../common/model");
const { validateSiret } = require("../../common/domain/siret");
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
    id_formation: Joi.string().allow(null, ""),
    siret_etablissement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  });

  /**
   * Schema for effectif cfa detail input validation
   */
  const dashboardEffectifCfaDetailInputSchema = Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    siret: Joi.string().allow(null, ""),
  });

  /**
   * Schema for region conversion validation
   */
  const dashboardConversionRegionInputSchema = Joi.object({
    num_region: Joi.string().required(),
  });

  /**
   * Schema for effetctifs by CFA body
   */
  const dashboardEffectifsByCfaBodySchema = Joi.object({
    date: Joi.date().required(),
    id_formation: Joi.string().allow(null, ""),
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
    "/region-conversion",
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardConversionRegionInputSchema.validateAsync(req.body, {
        abortEarly: false,
      });

      // Gets num region param
      const { num_region } = req.body;

      // Add user event
      const event = new UserEvent({
        username: "dashboard",
        type: "GET",
        action: `api/dashboard/region-conversion`,
        data: { num_region },
      });
      await event.save();

      // Gets cfas identified for num_region
      const nbCfaIdentified = await Cfa.countDocuments({
        region_num: num_region,
      });

      // Gets distincts cfa sirets for num_region
      const nbCfaConnected = await stats.getNbDistinctCfasBySiret({
        etablissement_num_region: num_region,
      });

      // Gets cfas validate for num_region
      const nbCfaDataValidated = await Cfa.countDocuments({
        region_num: num_region,
        feedback_donnee_valide: true,
      });

      // Build response
      return res.json({
        nbCfaIdentified,
        nbCfaConnected,
        nbCfaDataValidated,
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
  router.post(
    "/cfa-effectifs-detail",
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardEffectifCfaDetailInputSchema.validateAsync(req.body, {
        abortEarly: false,
      });

      // Gets & format params:
      const { startDate, endDate, siret } = req.body;
      const beginSearchDate = new Date(startDate);
      const endSearchDate = new Date(endDate);

      // Add user event
      const event = new UserEvent({
        username: "dashboard",
        type: "GET",
        action: "api/dashboard/cfa-effectifs-detail",
        data: { startDate, endDate, siret },
      });
      await event.save();

      // Checks if siret valid
      if (!validateSiret(siret)) {
        return res.status(400).json({ message: "Siret is not valid" });
      } else {
        // Search cfa in statuts
        const cfaFound = await StatutCandidat.findOne({
          siret_etablissement: siret,
        }).lean();
        if (!cfaFound) {
          return res.status(400).json({ message: `No cfa found for siret ${siret}` });
        } else {
          // Gets effectif data for params
          const effectifDetailCfaData = await dashboard.getEffectifsDetailDataForSiret(
            beginSearchDate,
            endSearchDate,
            siret
          );

          // Build response
          return res.json(effectifDetailCfaData);
        }
      }
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

  return router;
};
