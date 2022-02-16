const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ users, userEvents }) => {
  const router = express.Router();

  const updatedPasswordValidationSchema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(16).required(),
  });

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await updatedPasswordValidationSchema.validateAsync(req.body);

      try {
        const updatedUser = await users.updatePassword(req.body.token, req.body.newPassword);

        await userEvents.create({
          username: updatedUser.username,
          action: "update-password",
        });
        return res.json({ message: "success" });
      } catch (err) {
        return res.status(500).json({ message: "Could not update password" });
      }
    })
  );

  return router;
};
