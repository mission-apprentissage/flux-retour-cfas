const express = require("express");
const Joi = require("joi");
const { uaiRegex } = require("../../common/domain/uai");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");

module.exports = ({ demandeLienPrive }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        nom_organisme: Joi.string().required(),
        uai_organisme: Joi.string().regex(uaiRegex).required(),
        code_postal_organisme: Joi.string()
          .regex(/^[0-9]{5}$/)
          .required(),
        email_demandeur: Joi.string().email().required(),
      })
    ),
    tryCatch(async (req, res) => {
      const created = await demandeLienPrive.create(req.body);
      return res.json(created);
    })
  );

  return router;
};
