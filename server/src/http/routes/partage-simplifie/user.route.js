const express = require("express");
const { USER_EVENTS_TYPES, USER_EVENTS_ACTIONS } = require("../../../common/constants/userEventsConstants.js");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const validateRequestQuery = require("../../middlewares/validateRequestQuery.js");
const validateRequestBody = require("../../middlewares/validateRequestBody");
const { schema: uaiSchema } = require("../../../common/domain/uai");
const { schema: siretSchema } = require("../../../common/domain/siret");

module.exports = ({ partageSimplifieUsers, userEvents }) => {
  const router = express.Router();

  router.post(
    "/update-password",
    validateRequestBody(
      Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string().min(16).required(),
      })
    ),
    tryCatch(async (req, res) => {
      try {
        const updatedUser = await partageSimplifieUsers.updatePassword(req.body.token, req.body.newPassword);

        await userEvents.create({
          username: updatedUser.email,
          type: USER_EVENTS_TYPES.POST,
          action: USER_EVENTS_ACTIONS.UPDATE_PASSWORD,
        });
        return res.json({ message: "success" });
      } catch (err) {
        return res.status(500).json({ message: "Could not update password" });
      }
    })
  );

  router.get(
    "/exist",
    validateRequestQuery(Joi.object({ email: Joi.string().email().required() })),
    tryCatch(async (req, res) => {
      try {
        const foundUser = await partageSimplifieUsers.getUser(req.query.email);
        return res.json({ found: foundUser !== null });
      } catch (err) {
        return res.json({ found: false });
      }
    })
  );

  router.get(
    "/exist-uai-siret/",
    validateRequestQuery(Joi.object({ uai: uaiSchema.required(), siret: siretSchema.required() })),
    tryCatch(async (req, res) => {
      try {
        const foundUser = await partageSimplifieUsers.getUserFromUaiSiret({
          uai: req.query.uai,
          siret: req.query.siret,
        });
        return res.json({ found: foundUser !== null });
      } catch (err) {
        return res.json({ found: false });
      }
    })
  );

  return router;
};
