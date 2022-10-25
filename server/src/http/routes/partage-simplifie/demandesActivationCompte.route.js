const express = require("express");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../../middlewares/validateRequestBody");
const Joi = require("joi");

module.exports = ({ demandesActivationComptePartageSimplifie }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(Joi.object({ email: Joi.string().email().required() })),
    tryCatch(async (req, res) => {
      const createdId = await demandesActivationComptePartageSimplifie.createDemandeActivationCompte(req.body?.email);
      return res.json({ createdId });
    })
  );

  return router;
};
