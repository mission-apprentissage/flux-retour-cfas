const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ formations }) => {
  const router = express.Router();

  const searchBodyValidationSchema = Joi.object({
    searchTerm: Joi.string().min(3),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
  });

  const getFormationParamsSchema = Joi.object({
    cfd: Joi.string().required(),
  });

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { error } = searchBodyValidationSchema.validate(req.body);

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message });
      }

      const foundFormations = await formations.searchFormationByIntituleOrCfd(req.body);

      return res.json(foundFormations.map(({ cfd, libelle }) => ({ cfd, libelle })));
    })
  );

  router.get(
    "/:cfd",
    tryCatch(async (req, res) => {
      const { error } = getFormationParamsSchema.validate(req.params);

      if (error) {
        return res.status(400).json({ status: "INPUT_VALIDATION_ERROR", message: error.message });
      }

      const foundFormation = await formations.getFormationWithCfd(req.params.cfd);

      return res.json(foundFormation);
    })
  );

  return router;
};
