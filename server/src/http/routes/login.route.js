const express = require("express");
const { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } = require("../../common/constants/userEventsConstants");
const { createUserToken } = require("../../common/utils/jwtUtils");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ users, userEvents }) => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const { username, password } = req.body;
      const authenticatedUser = await users.authenticate(username, password);

      if (!authenticatedUser) return res.status(401).send();

      const token = createUserToken(authenticatedUser);

      await userEvents.create({ username, type: USER_EVENTS_TYPES.POST, action: USER_EVENTS_ACTIONS.LOGIN });
      return res.json({ access_token: token });
    })
  );

  return router;
};
