const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");

const { UserEvent } = require("../../common/model");

module.exports = ({ stats, dashboard }) => {
  const router = express.Router();

  /**
   * Schema for validation
   */
  const dashboardInputSchema = Joi.object({
    beginDate: Joi.date().required(),
    endDate: Joi.date().required(),
    filters: Joi.object().allow(null),
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
      await dashboardInputSchema.validateAsync(req.body, { abortEarly: false });

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
  return router;
};
