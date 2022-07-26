const Joi = require("joi");
const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");
const { tdbRoles } = require("../../common/roles");
const config = require("../../../config");

const mapUserToApiOutput = (user) => {
  return {
    username: user.username,
    email: user.email,
    permissions: user.permissions,
    network: user.network,
    created_at: user.created_at,
  };
};

module.exports = ({ users }) => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const allUsers = await users.getAll();

      const usersMapped = allUsers.map(mapUserToApiOutput);
      return res.json(usersMapped);
    })
  );

  router.post(
    "/",
    validateRequestBody(
      Joi.object({
        username: Joi.string().required(),
        email: Joi.string().required(),
        role: Joi.string().valid(tdbRoles.pilot, tdbRoles.network).required(),
        network: Joi.string(),
      })
    ),
    tryCatch(async (req, res) => {
      const { username, email, role, network } = req.body;
      const createdUser = await users.createUser({
        username,
        email,
        permissions: [role],
        network: network || null,
      });
      return res.json(mapUserToApiOutput(createdUser));
    })
  );

  router.post(
    "/generate-update-password-url",
    tryCatch(async (req, res) => {
      const passwordUpdateToken = await users.generatePasswordUpdateToken(req.body.username);
      const passwordUpdateUrl = `${config.publicUrl}/modifier-mot-de-passe?token=${passwordUpdateToken}`;

      return res.json({ passwordUpdateUrl });
    })
  );

  router.delete(
    "/:username",
    tryCatch(async (req, res) => {
      const { username } = req.params;

      if (username) {
        const found = await users.getUser(username);

        if (!found)
          return res.status(500).json({
            status: "Error",
            message: "Username not found",
          });

        await users.removeUser(username);
        return res.json({
          status: "Success",
          message: `User ${username} has been deleted `,
        });
      } else {
        return res.status(500).json({
          status: "Error",
          message: "Username null or undefined",
        });
      }
    })
  );

  return router;
};
