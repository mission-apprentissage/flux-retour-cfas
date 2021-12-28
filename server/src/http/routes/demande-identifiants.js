const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ demandeIdentifiants }) => {
  const router = express.Router();

  const demandeIdentifiantsBodyValidationSchema = Joi.object({
    region: Joi.string().required(),
    profil: Joi.string().required(),
    email: Joi.string().required(),
  });

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await demandeIdentifiantsBodyValidationSchema.validateAsync(req.body);
      await demandeIdentifiants.create(req.body);
      return res.json({});
    })
  );

  return router;
};
