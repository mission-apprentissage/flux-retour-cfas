const express = require("express");
const Joi = require("joi");
const { uaiRegex } = require("../../common/domain/uai");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ demandeBranchementErp }) => {
  const router = express.Router();

  const demandeBranchementErpValidationSchema = Joi.object({
    erp: Joi.string().required(),
    nom_organisme: Joi.string().required(),
    uai_organisme: Joi.string().regex(uaiRegex).required(),
    email_demandeur: Joi.string().email().required(),
    nb_apprentis: Joi.string().allow(null, ""),
  });

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const { error } = demandeBranchementErpValidationSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: "INPUT_VALIDATION_ERROR",
          message: error.message,
        });
      }

      const created = await demandeBranchementErp.create(req.body);
      return res.json(created);
    })
  );

  return router;
};
