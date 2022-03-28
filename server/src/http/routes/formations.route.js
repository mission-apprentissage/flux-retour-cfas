const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");

module.exports = ({ formations }) => {
  const router = express.Router();

  router.post(
    "/search",
    validateRequestBody(
      Joi.object({
        searchTerm: Joi.string().min(3),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
      })
    ),
    tryCatch(async (req, res) => {
      const foundFormations = await formations.searchFormations(req.body);

      return res.json(foundFormations.map(({ cfd, libelle }) => ({ cfd, libelle })));
    })
  );

  router.get(
    "/:cfd",
    tryCatch(async (req, res) => {
      const foundFormation = await formations.getFormationWithCfd(req.params.cfd);

      return res.json(foundFormation);
    })
  );

  return router;
};
