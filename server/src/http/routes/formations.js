const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ formations }) => {
  const router = express.Router();

  const searchBodyValidationSchema = Joi.object({
    searchTerm: Joi.string().min(3).required(),
    siret_etablissement: Joi.string().allow(null, ""),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
  });

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { error } = searchBodyValidationSchema.validate(req.body);
      const { searchTerm, ...otherFilters } = req.body;

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message });
      }

      const foundFormations = await formations.searchFormationByIntituleOrCfd(searchTerm, otherFilters);

      return res.json(foundFormations.map(({ cfd, libelle }) => ({ cfd, libelle })));
    })
  );

  return router;
};
