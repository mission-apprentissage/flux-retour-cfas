const express = require("express");
const { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } = require("../../common/constants/userEventsConstants");
const { tdbRoles } = require("../../common/roles");
const { createUserToken } = require("../../common/utils/jwtUtils");

module.exports = ({ cfas, userEvents }) => {
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
      await userEvents.create({
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
