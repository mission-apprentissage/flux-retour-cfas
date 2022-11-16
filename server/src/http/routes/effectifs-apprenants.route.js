import express from "express";
import Joi from "joi";
import tryCatch from "../middlewares/tryCatchMiddleware.js";
import { JOB_NAMES, jobEventStatuts } from "../../common/constants/jobsConstants.js";
import { findAndPaginate } from "../../common/utils/dbUtils.js";
import validateRequestQuery from "../middlewares/validateRequestQuery.js";
import { effectifsApprenantsDb } from "../../common/model/collections.js";
import { sendTransformedPaginatedJsonStream } from "../../common/utils/httpUtils.js";

export default ({ jobEvents }) => {
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

        //  Return JSON Stream
        return sendTransformedPaginatedJsonStream(find.stream(), "effectifsApprenants", pagination, res);
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
