const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = (components) => {
  const router = express.Router();

  const demandeAccesBodyValidationSchema = Joi.object({
    region: Joi.string().required(),
    profil: Joi.string().required(),
    email: Joi.string().required(),
  });

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await demandeAccesBodyValidationSchema.validateAsync(req.body);

      await components.demandeAcces.create(req.body);

      return res.json({});
    })
  );

  return router;
};
