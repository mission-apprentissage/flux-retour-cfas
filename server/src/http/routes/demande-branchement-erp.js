const express = require("express");
const Joi = require("joi");
const { uaiRegex } = require("../../common/domain/uai");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");

module.exports = ({ demandeBranchementErp }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        erp: Joi.string().required(),
        nom_organisme: Joi.string().required(),
        uai_organisme: Joi.string().regex(uaiRegex).required(),
        email_demandeur: Joi.string().email().required(),
        nb_apprentis: Joi.string().allow(null, ""),
      })
    ),
    tryCatch(async (req, res) => {
      const created = await demandeBranchementErp.create(req.body);
      return res.json(created);
    })
  );

  return router;
};
