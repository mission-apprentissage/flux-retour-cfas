const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { JOB_NAMES, jobEventStatuts } = require("../../common/constants/jobsConstants");
const { oleoduc, transformIntoJSON } = require("oleoduc");
const { sendJsonStream } = require("../../common/utils/httpUtils");
const { findAndPaginate } = require("../../common/utils/dbUtils");
const validateRequestQuery = require("../middlewares/validateRequestQuery");
const { effectifsApprenantsDb } = require("../../common/model/collections");

module.exports = ({ jobEvents }) => {
  const router = express.Router();

  /**
   * Récupération des effectifs apprenants avec pagination
   */
  router.get(
    "/",
    validateRequestQuery(
      Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
      })
    ),
    tryCatch(async (req, res) => {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 1000);

      if (!(await jobEvents.isJobInAction(JOB_NAMES.createEffectifsApprenantsCollection, jobEventStatuts.ended))) {
        // Job RCO not ended, no data should be get
        res.status(503).json({
          status: "ERROR",
          message: "Les données ne sont pas disponibles, merci de renvoyer une requête dans quelques instants",
        });
      } else {
        const { find, pagination } = await findAndPaginate(
          effectifsApprenantsDb(),
          {},
          { projection: { created_at: 0, updated_at: 0, _id: 0, __v: 0 }, page, limit: limit }
        );

        return sendJsonStream(
          oleoduc(
            find.stream(),
            transformIntoJSON({
              arrayPropertyName: "effectifsApprenants",
              arrayWrapper: {
                pagination,
              },
            })
          ),
          res
        );
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
