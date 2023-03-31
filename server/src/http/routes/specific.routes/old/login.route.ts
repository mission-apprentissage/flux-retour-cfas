import express from "express";

import { authenticateLegacy } from "../../../../common/actions/legacy/users.legacy.actions.js";
import { createUserToken } from "../../../../common/utils/jwtUtils.js";
import validateRequestMiddleware from "../../../../http/middlewares/validateRequestMiddleware.js";
import loginSchema from "../../../../common/validation/loginSchema.js";

export default () => {
  const router = express.Router(); // eslint-disable-line new-cap

  router.post(
    "/",
    validateRequestMiddleware({
      body: loginSchema.strict(),
    }),
    async (req, res) => {
      const { username, password } = req.body;
      const authenticatedUser = await authenticateLegacy(username, password);

      if (!authenticatedUser) return res.status(401).send();

      const access_token = createUserToken(authenticatedUser);
      return res.json({ access_token });
    }
  );

  return router;
};
