import express from "express";
import { createUserEvent } from "../../../../common/actions/userEvents.actions.js";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../../../common/constants/userEventsConstants.js";
import { tdbRoles } from "../../../../common/roles.js";
import { createUserToken } from "../../../../common/utils/jwtUtils.js";

export default ({ cfas }) => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.post("/", async (req, res) => {
    const { cfaAccessToken } = req.body;
    const cfaFound = await cfas.getFromAccessToken(cfaAccessToken);

    if (cfaFound) {
      const syntheticCfaUser = {
        username: cfaFound.uai,
        permissions: [tdbRoles.cfa],
      };
      const token = createUserToken(syntheticCfaUser);
      await createUserEvent({
        type: USER_EVENTS_TYPES.POST,
        username: syntheticCfaUser.username,
        action: USER_EVENTS_ACTIONS.LOGIN_CFA,
      });
      return res.json({ access_token: token });
    }
    return res.status(401).send("Not authorized");
  });

  return router;
};
