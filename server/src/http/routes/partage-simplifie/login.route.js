const express = require("express");
const { USER_EVENTS_TYPES, USER_EVENTS_ACTIONS } = require("../../../common/constants/userEventsConstants.js");
const { createPsUserToken } = require("../../../common/utils/jwtUtils.js");
const tryCatch = require("../../middlewares/tryCatchMiddleware");

module.exports = ({ partageSimplifieUsers, userEvents }) => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const { email, password } = req.body;
      const authenticatedUser = await partageSimplifieUsers.authenticate(email, password);

      if (!authenticatedUser) {
        await userEvents.create({
          username: email,
          type: USER_EVENTS_TYPES.POST,
          action: USER_EVENTS_ACTIONS.LOGIN_EVENT.FAIL,
        });
        return res.status(401).send();
      }

      const token = createPsUserToken(authenticatedUser);
      await userEvents.create({
        username: email,
        type: USER_EVENTS_TYPES.POST,
        action: USER_EVENTS_ACTIONS.LOGIN_EVENT.SUCCESS,
      });

      return res.json({ access_token: token });
    })
  );

  return router;
};
