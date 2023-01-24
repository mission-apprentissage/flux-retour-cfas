import express from "express";
// import Joi from "joi";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
// import { JOB_NAMES, jobEventStatuts } from "../../../../common/constants/jobsConstants.js";
// import { findAndPaginate } from "../../../../common/utils/dbUtils.js";
// import { effectifsApprenantsDb } from "../../../../common/model/collections.js";
// import { sendTransformedPaginatedJsonStream } from "../../../../common/utils/httpUtils.js";
// import { isJobInAction } from "../../../../common/actions/jobEvents.actions.js";

export default () => {
  const router = express.Router();

  /**
   * Récupération des effectifs apprenants avec pagination
   */
  router.get(
    "/",
    tryCatch(async (req, res) => {
      // const params = await Joi.object({
      //   page: Joi.number(),
      //   limit: Joi.number(),
      // }).validateAsync(req.query, { abortEarly: false });

      // const page = Number(params.page ?? 1);
      // const limit = Number(params.limit ?? 1000);

      res.status(503).json({
        status: "ERROR",
        message: "Les données ne sont pas disponibles.",
      });

      // TODO : Remettre la construction des effectifsApprenants une fois décidé coté métier.
      // if (!(await isJobInAction(JOB_NAMES.createEffectifsApprenantsCollection, jobEventStatuts.ended))) {
      //   // Job RCO not ended, no data should be get
      //   res.status(503).json({
      //     status: "ERROR",
      //     message: "Les données ne sont pas disponibles.",
      //   });
      // } else {
      //   const { find, pagination } = await findAndPaginate(
      //     effectifsApprenantsDb(),
      //     {},
      //     { projection: { created_at: 0, updated_at: 0, _id: 0, __v: 0 }, page, limit: limit }
      //   );

      //   //  Return JSON Stream
      //   return sendTransformedPaginatedJsonStream(find.stream(), "effectifsApprenants", pagination, res);
      // }
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
