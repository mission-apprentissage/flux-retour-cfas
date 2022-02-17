const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");

module.exports = ({ demandeIdentifiants }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        region: Joi.string().required(),
        profil: Joi.string().required(),
        email: Joi.string().required(),
      })
    ),
    tryCatch(async (req, res) => {
      await demandeIdentifiants.create(req.body);
      return res.json({});
    })
  );

  return router;
};
