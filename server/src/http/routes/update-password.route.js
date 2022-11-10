const express = require("express");
const Joi = require("joi");
const { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } = require("../../common/constants/userEventsConstants");
const logger = require("../../common/logger");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");

module.exports = ({ users, userEvents }) => {
  const router = express.Router();

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string().min(16).required(),
      })
    ),
    tryCatch(async (req, res) => {
      try {
        const username = await users.updatePassword(req.body.token, req.body.newPassword);

        await userEvents.create({
          type: USER_EVENTS_TYPES.POST,
          username: username,
          action: USER_EVENTS_ACTIONS.UPDATE_PASSWORD,
        });
        return res.json({ message: "success" });
      } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Could not update password" });
      }
    })
  );

  return router;
};
