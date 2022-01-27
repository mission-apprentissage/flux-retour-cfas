const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { oleoduc, transformData } = require("oleoduc");
const { RcoStatutCandidatModel } = require("../../common/model");
const { sendJsonStream } = require("../../common/utils/httpUtils");
const { jobNames, jobEventStatuts } = require("../../common/model/constants");

module.exports = ({ jobEvents }) => {
  const router = express.Router();

  /**
   * Récupération des statuts pour RCO au format NDJson
   */
  router.get(
    "/statutsCandidats.ndjson",
    tryCatch(async (req, res) => {
      let { limit } = await Joi.object({ limit: Joi.number().default(1000000) }).validateAsync(req.query, {
        abortEarly: false,
      });

      if (!(await jobEvents.isJobInAction(jobNames.createRcoStatutsCollection, jobEventStatuts.ended))) {
        // Job RCO not ended, no data should be get
        res.status(501).json({
          status: "ERROR",
          message: "Les données ne sont pas disponibles, merci de renvoyer une requête dans quelques instants",
        });
      } else {
        let stream = oleoduc(
          RcoStatutCandidatModel.find({}, { created_at: 0, updated_at: 0, _id: 0, __v: 0 }).limit(limit).cursor(),
          transformData((item) => `${JSON.stringify(item)}\n`)
        );
        return sendJsonStream(stream, res);
      }
    })
  );

  /**
   * Test route
   */
  router.get(
    "/test",
    tryCatch(async (_req, res) => {
      return res.json({ msg: "ok" });
    })
  );

  return router;
};
