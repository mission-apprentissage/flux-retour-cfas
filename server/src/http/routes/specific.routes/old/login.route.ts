import express from "express";
import { authenticateLegacy } from "../../../../common/actions/legacy/users.legacy.actions";
import { createUserEvent } from "../../../../common/actions/userEvents.actions";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../../../common/constants/userEventsConstants";
import { createUserToken } from "../../../../common/utils/jwtUtils";
import tryCatch from "../../../middlewares/tryCatchMiddleware";

export default () => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const { username, password } = req.body;
      const authenticatedUser = await authenticateLegacy(username, password);

      if (!authenticatedUser) return res.status(401).send();

      const token = createUserToken(authenticatedUser);

      await createUserEvent({ username, type: USER_EVENTS_TYPES.POST, action: USER_EVENTS_ACTIONS.LOGIN });
      return res.json({ access_token: token });
    })
  );

  return router;
};
