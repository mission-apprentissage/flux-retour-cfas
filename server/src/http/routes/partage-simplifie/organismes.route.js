const express = require("express");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { schema: uaiSchema } = require("../../../common/domain/uai");
const validateRequestParams = require("../../middlewares/validateRequestParams.js");

module.exports = ({ organismes }) => {
  const router = express.Router();

  router.get(
    "/:uai",
    validateRequestParams(Joi.object({ uai: uaiSchema.required() })),
    tryCatch(async (req, res) => {
      try {
        const organismesFound = await organismes.getOrganismesFromReferentiel(req.params.uai);
        return res.json({ organismes: organismesFound });
      } catch (err) {
        return res.json({ organismes: [], error: err });
      }
    })
  );

  return router;
};
