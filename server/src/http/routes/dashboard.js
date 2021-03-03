const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent, StatutCandidat, Cfa } = require("../../common/model");
const { validateSiret } = require("../../common/domain/siret");

module.exports = ({ stats, dashboard }) => {
  const router = express.Router();

  /**
   * Schema for effectif validation
   */
  const dashboardEffectifInputSchema = Joi.object({
    beginDate: Joi.date().required(),
    endDate: Joi.date().required(),
    filters: Joi.object().allow(null),
  });

  /**
   * Schema for cfa data validation
   */
  const dashboardInfosCfaInputSchema = Joi.object({
    siret: Joi.string().required(),
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
   * Gets the effectifs data for input period & query
   */
  router.post(
    "/effectifs",
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardEffectifInputSchema.validateAsync(req.body, { abortEarly: false });

      // Gets & format params
      const { beginDate, endDate, filters = {} } = req.body;
      const beginSearchDate = new Date(beginDate);
      const endSearchDate = new Date(endDate);

      // Add user event
      const event = new UserEvent({
        username: "dashboard",
        type: "GET",
        action: "api/dashboard/effectifs",
        data: { beginDate, endDate, filters },
      });
      await event.save();

      // Gets effectif data for params
      const effectifData = await dashboard.getEffectifsData(beginSearchDate, endSearchDate, filters);

      // Build response
      return res.json([
        {
          date: beginDate,
          apprentis: effectifData.beginDate.nbApprentis,
          inscrits: effectifData.beginDate.nbInscrits,
          abandons: effectifData.beginDate.nbAbandons,
        },
        {
          date: endDate,
          apprentis: effectifData.endDate.nbApprentis,
          inscrits: effectifData.endDate.nbInscrits,
          abandons: effectifData.endDate.nbAbandons,
          dataConsistency: null,
        },
      ]);
    })
  );

  /**
   * Gets the dashboard data for cfa
   */
  router.post(
    "/cfa",
    tryCatch(async (req, res) => {
      // Validate schema
      await dashboardInfosCfaInputSchema.validateAsync(req.body, { abortEarly: false });

      // Gets & format params
      const { siret } = req.body;

      // Add user event
      const event = new UserEvent({
        username: "dashboard",
        type: "GET",
        action: `api/dashboard/cfa/${siret}`,
        data: { siret },
      });
      await event.save();

      // Checks if siret valid
      if (!validateSiret(siret)) {
        return res.status(400).json({ message: "Siret is not valid" });
      } else {
        // Search cfa in statuts
        const cfaFound = await StatutCandidat.findOne({ siret_etablissement: siret }).lean();
        if (!cfaFound) {
          return res.status(400).json({ message: `No cfa found for siret ${siret}` });
        } else {
          // Search reseaux for cfa in référentiel
          const cfaInReferentiel = await Cfa.findOne({ siret: siret }).lean();

          // Build response
          return res.json({
            libelleLong: cfaFound.nom_etablissement,
            reseaux: cfaInReferentiel ? cfaInReferentiel.reseaux ?? [] : [],
            domainesMetiers: [],
            uai: cfaFound.uai_etablissement,
            adresse: cfaFound.etablissement_adresse,
          });
        }
      }
    })
  );

  return router;
};
