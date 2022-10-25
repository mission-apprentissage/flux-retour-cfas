const express = require("express");
const { USER_EVENTS_TYPES, USER_EVENTS_ACTIONS } = require("../../../common/constants/userEventsConstants.js");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../../middlewares/validateRequestBody");
const Joi = require("joi");
const { toUserApiOutput } = require("../../../common/model/mappers/userApiMapper.js");
const config = require("../../../../config/index.js");

module.exports = ({ partageSimplifieUsers, userEvents }) => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const { user } = req;

      const allUsers = await partageSimplifieUsers.getAllUsers();
      const usersMapped = allUsers.map(toUserApiOutput);

      await userEvents.create({
        username: user.email,
        type: USER_EVENTS_TYPES.GET,
        action: USER_EVENTS_ACTIONS.USERS.GET_ALL,
      });

      return res.json(usersMapped);
    })
  );

  router.post(
    "/generate-update-password-url",
    tryCatch(async (req, res) => {
      const passwordUpdateToken = await partageSimplifieUsers.generatePasswordUpdateToken(req.body.email);
      const passwordUpdateUrl = `${config.publicUrl}/partage-simplifie/modifier-mot-de-passe?token=${passwordUpdateToken}`;

      return res.json({ passwordUpdateUrl });
    })
  );

  router.post(
    "/search",
    validateRequestBody(Joi.object({ searchTerm: Joi.string().min(3) })),
    tryCatch(async (req, res) => {
      const foundUsers = await partageSimplifieUsers.searchUsers(req.body);
      const usersMapped = foundUsers.map(toUserApiOutput);
      return res.json(usersMapped);
    })
  );

  return router;
};
