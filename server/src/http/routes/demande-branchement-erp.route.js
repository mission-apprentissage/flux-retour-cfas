import express from "express";
import Joi from "joi";
import { schema as uaiSchema } from "../../common/domain/uai.js";
import tryCatch from "../middlewares/tryCatchMiddleware.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";

export default ({ demandeBranchementErp }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        erp: Joi.string().required(),
        nom_organisme: Joi.string().required(),
        uai_organisme: uaiSchema.required(),
        email_demandeur: Joi.string().email().required(),
        nb_apprentis: Joi.string().allow(null, ""),
        is_ready_co_construction: Joi.boolean(),
      })
    ),
    tryCatch(async (req, res) => {
      const created = await demandeBranchementErp.create(req.body);
      return res.json(created);
    })
  );

  return router;
};
