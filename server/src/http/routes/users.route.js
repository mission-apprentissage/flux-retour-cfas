const Joi = require("joi");
const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");
const { tdbRoles } = require("../../common/roles");

const mapUserToApiOutput = (user) => {
  return {
    username: user.username,
    email: user.email,
    permissions: user.permissions,
    network: user.network,
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

  return router;
};
