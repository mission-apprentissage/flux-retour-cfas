import express from "express";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../common/constants/userEventsConstants.js";
import { createUserToken } from "../../common/utils/jwtUtils.js";
import tryCatch from "../middlewares/tryCatchMiddleware.js";

export default ({ users, userEvents }) => {
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
