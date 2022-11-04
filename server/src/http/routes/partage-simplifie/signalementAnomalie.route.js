const express = require("express");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../../middlewares/validateRequestBody");
const Joi = require("joi");

module.exports = ({ signalementAnomaliePartageSimplifie }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(Joi.object({ email: Joi.string().email().required(), message: Joi.string().required() })),
    tryCatch(async (req, res) => {
      const { email, message } = req.body;
      const createdId = await signalementAnomaliePartageSimplifie.createSignalementAnomalie(email, message);
      return res.json({ createdId });
    })
  );

  return router;
};
