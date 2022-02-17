const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { jobNames, jobEventStatuts } = require("../../common/model/constants");
const { oleoduc, transformIntoJSON } = require("oleoduc");
const { sendJsonStream } = require("../../common/utils/httpUtils");
const { findAndPaginate } = require("../../common/utils/dbUtils");
const validateRequestQuery = require("../middlewares/validateRequestQuery");

module.exports = ({ db, jobEvents }) => {
  const router = express.Router();

  /**
   * Récupération des statuts pour RCO avec pagination
   */
  router.get(
    "/statutsCandidats",
    validateRequestQuery(
      Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
      })
    ),
    tryCatch(async (req, res) => {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 1000);

      if (!(await jobEvents.isJobInAction(jobNames.createRcoStatutsCollection, jobEventStatuts.ended))) {
        // Job RCO not ended, no data should be get
        res.status(501).json({
          status: "ERROR",
          message: "Les données ne sont pas disponibles, merci de renvoyer une requête dans quelques instants",
        });
      } else {
        const { find, pagination } = await findAndPaginate(
          db.collection("rcoStatutsCandidats"),
          {},
          { projection: { created_at: 0, updated_at: 0, _id: 0, __v: 0 }, page, limit: limit }
        );

        return sendJsonStream(
          oleoduc(
            find.stream(),
            transformIntoJSON({
              arrayPropertyName: "rcoStatutsCandidats",
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
