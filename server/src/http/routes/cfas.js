const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ cfas, cfaDataFeedback }) => {
  const router = express.Router();

  const searchBodyValidationSchema = Joi.object({
    searchTerm: Joi.string().min(3).required(),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
  });

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { error } = searchBodyValidationSchema.validate(req.body);
      const { searchTerm, ...otherFilters } = req.body;

      if (error) {
        return res.status(400).json({
          status: "INPUT_VALIDATION_ERROR",
          message: error.message,
        });
      }

      const foundCfa = await cfas.searchCfasByNomEtablissementOrUai(searchTerm, otherFilters);
      return res.json(foundCfa);
    })
  );

  const dataFeedbackBodyValidationSchema = Joi.object({
    siret: Joi.string().required(),
    email: Joi.string().required(),
    details: Joi.string().required(),
    dataIsValid: Joi.boolean().required(),
  });

  router.post(
    "/data-feedback",
    tryCatch(async (req, res) => {
      const { error } = dataFeedbackBodyValidationSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: "INPUT_VALIDATION_ERROR",
          message: error.message,
        });
      }

      const created = await cfaDataFeedback.createCfaDataFeedback(req.body);

      return res.json(created);
    })
  );

  router.get(
    "/data-feedback",
    tryCatch(async (req, res) => {
      const { siret } = req.query;

      const foundDataFeedback = await cfaDataFeedback.getCfaDataFeedbackBySiret(siret);
      console.log(foundDataFeedback);
      return res.json(foundDataFeedback);
    })
  );

  return router;
};
