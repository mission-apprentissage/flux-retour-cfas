const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ cfas }) => {
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

  return router;
};
