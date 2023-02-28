import express from "express";
import tryCatch from "../middlewares/tryCatchMiddleware.js";
import { updateUserLastConnection, structureUser } from "../../common/actions/users.actions.js";

export default () => {
  const router = express.Router();

  router.get(
    "/current",
    tryCatch(async (req, res) => {
      if (req.user) {
        await updateUserLastConnection(req.user.email);
        return res.status(200).json({
          ...req.user,
          loggedIn: true,
        });
      }
      const payload = await structureUser({ email: "anonymous", roles: [], acl: [] });
      return res.json(payload);
    })
  );

  return router;
};
