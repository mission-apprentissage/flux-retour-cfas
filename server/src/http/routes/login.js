const express = require("express");
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

      await userEvents.createUserEvent({ username, action: "login" });
      return res.json({ access_token: token });
    })
  );

  return router;
};
