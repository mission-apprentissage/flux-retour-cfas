import express from "express";
import Joi from "joi";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../../common/constants/userEventsConstants.js";
import logger from "../../../common/logger.js";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";

export default ({ users, userEvents }) => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const { token, newPassword } = await Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string().min(16).required(),
      }).validateAsync(req.body, { abortEarly: false });

      try {
        const username = await users.updatePassword(token, newPassword);

        await userEvents.create({
          type: USER_EVENTS_TYPES.POST,
          username: username,
          action: USER_EVENTS_ACTIONS.UPDATE_PASSWORD,
        });
        return res.json({ message: "success" });
      } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Could not update password" });
      }
    })
  );

  return router;
};
