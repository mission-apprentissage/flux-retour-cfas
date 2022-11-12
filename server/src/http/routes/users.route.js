import Joi from "joi";
import express from "express";
import tryCatch from "../middlewares/tryCatchMiddleware.js";
import validateRequestBody from "../middlewares/validateRequestBody.js";
import { tdbRoles } from "../../common/roles.js";
import config from "../../../config/index.js";

const mapUserToApiOutput = (user) => {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    permissions: user.permissions,
    network: user.network,
    region: user.region,
    organisme: user.organisme,
    created_at: user.created_at,
  };
};

export default ({ users }) => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const allUsers = await users.getAll();

      const usersMapped = allUsers.map(mapUserToApiOutput);
      return res.json(usersMapped);
    })
  );

  router.get(
    "/:id",
    tryCatch(async (req, res) => {
      const { id } = req.params;

      if (id) {
        const found = await users.getUserById(id);

        if (!found)
          return res.status(500).json({
            status: "Error",
            message: "User not found",
          });

        return res.json(mapUserToApiOutput(found));
      } else {
        return res.status(500).json({
          status: "Error",
          message: "User id null or undefined",
        });
      }
    })
  );

  router.post(
    "/search",
    validateRequestBody(
      Joi.object({
        searchTerm: Joi.string().min(3),
      })
    ),
    tryCatch(async (req, res) => {
      const foundUsers = await users.searchUsers(req.body);
      return res.json(foundUsers);
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
        region: Joi.string(),
        organisme: Joi.string(),
      })
    ),
    tryCatch(async (req, res) => {
      const { username, email, role, network, region, organisme } = req.body;
      const createdUser = await users.createUser({
        username,
        email,
        permissions: [role],
        network: network || null,
        region: region || null,
        organisme: organisme || null,
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

  router.put(
    "/:id",
    tryCatch(async (req, res) => {
      const { id } = req.params;
      const { username, email, role, network, region, organisme } = req.body;

      if (id) {
        const found = await users.getUserById(id);

        if (!found)
          return res.status(500).json({
            status: "Error",
            message: `User not found for id ${id}`,
          });

        await users.updateUser(id, { username, email, role, network, region, organisme });
        return res.json({
          status: "Success",
          message: `User ${username} has been updated `,
        });
      } else {
        return res.status(500).json({
          status: "Error",
          message: "Id is missing, can't find a user",
        });
      }
    })
  );
  return router;
};
