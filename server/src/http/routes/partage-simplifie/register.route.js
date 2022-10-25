const express = require("express");
const { USER_EVENTS_TYPES, USER_EVENTS_ACTIONS } = require("../../../common/constants/userEventsConstants.js");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../../middlewares/validateRequestBody");
const Joi = require("joi");
const { schema: uaiSchema } = require("../../../common/domain/uai");
const { schema: siretSchema } = require("../../../common/domain/siret");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../common/roles.js");

module.exports = ({ partageSimplifieUsers, userEvents }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        email: Joi.string().email().required(),
        uai: uaiSchema.required(),
        siret: siretSchema.required(),
        nom: Joi.string().required(),
        nom_etablissement: Joi.string().allow("", null),
        adresse_etablissement: Joi.string().allow("", null),
        prenom: Joi.string().required(),
        fonction: Joi.string().required(),
        region: Joi.string().required(),
        telephone: Joi.string().allow(null, ""),
        outils_gestion: Joi.array().items(Joi.string()).allow(null),
      })
    ),
    tryCatch(async (req, res) => {
      const { email, ...props } = req.body;

      await partageSimplifieUsers.createUser({ ...props, role: PARTAGE_SIMPLIFIE_ROLES.OF, email });

      await userEvents.create({
        username: email,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.REGISTER,
      });

      return res.json({ message: "success" });
    })
  );

  return router;
};
