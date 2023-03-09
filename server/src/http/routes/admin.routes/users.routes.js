import express from "express";
import Joi from "joi";
import Boom from "boom";

import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { findOrganismeById } from "../../../common/actions/organismes/organismes.actions.js";
import {
  createUser,
  getAllUsers,
  getUser,
  getUserById,
  removeUser,
  searchUsers,
  structureUser,
  updateUser,
} from "../../../common/actions/users.actions.js";
import { getAllRoles, findRolesByNames } from "../../../common/actions/roles.actions.js";
import {
  getAllPermissions,
  updatePermissionsPending,
  removePermissions,
} from "../../../common/actions/permissions.actions.js";
import { refreshUserPermissions } from "../../../common/actions/users.afterCreate.actions.js";

// TODO [tech]
// eslint-disable-next-line no-unused-vars
export default ({ mailer }) => {
  const router = express.Router();

  router.get(
    "/users",
    tryCatch(async (req, res) => {
      let usersList = await getAllUsers();
      let roleNamesById = (await getAllRoles()).reduce(
        (acc, role) => ({ ...acc, [role._id.toString()]: role.name }),
        {}
      );
      let permissionsByEmail = (await getAllPermissions()).reduce(
        (acc, permission) => ({
          ...acc,
          [permission.userEmail]: [...(acc?.[permission.userEmail] || []), permission],
        }),
        {}
      );

      for (let index = 0; index < usersList.length; index++) {
        const user = usersList[index];
        user.permissions = permissionsByEmail[user.email] || [];
        for (let j = 0; j < user.roles.length; j++) {
          const roleId = user.roles[j];
          user.roles[j] = roleNamesById[roleId];
        }
      }

      return res.json(usersList);
    })
  );

  router.post(
    "/users/search",
    tryCatch(async ({ body }, res) => {
      const { searchTerm } = await Joi.object({
        searchTerm: Joi.string().min(3),
      }).validateAsync(body, { abortEarly: false });

      const foundUsers = await searchUsers(searchTerm);
      const usersMapped = await Promise.all(foundUsers.map(async (u) => await structureUser(u)));
      return res.json(usersMapped);
    })
  );

  /**
   * Cette route confirme toutes les permissions d'un utilisateur pour un organisme.
   * Si organisme_id === "all", alors toutes les permissions de l'utilisateur sont confirmées.
   */
  router.get(
    "/users/confirm-user",
    tryCatch(async ({ query }, res) => {
      const { userEmail, organisme_id, validate } = await Joi.object({
        userEmail: Joi.string().email().required(),
        organisme_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}|all$/, "invalid organisme_id")
          .required(),
        validate: Joi.boolean().required(),
      }).validateAsync(query, { abortEarly: false });

      const user = await getUser(userEmail);
      if (!user) {
        Boom.notFound(`User ${userEmail} not found`);
      }

      let organisme = null;
      if (organisme_id !== "all") {
        organisme = await findOrganismeById(organisme_id);
        if (organisme_id && !organisme) {
          Boom.notFound(`Organisme ${organisme_id} not found`);
        }
      }

      if (validate) {
        await updatePermissionsPending({ userEmail, organisme_id: organisme?._id, pending: false });
        await mailer.sendEmail({ to: userEmail, payload: { user, organisme } }, "notify_access_granted");
      } else {
        await removePermissions({ organisme_id: organisme?._id, userEmail });
        await mailer.sendEmail({ to: userEmail, payload: { user, organisme } }, "notify_access_rejected");
      }
      return res.json({ ok: true });
    })
  );

  router.post(
    "/user",
    tryCatch(async ({ body }, res) => {
      const { password, options } = await Joi.object({
        password: Joi.string().required(),
        options: Joi.object({
          prenom: Joi.string().required(),
          nom: Joi.string().required(),
          email: Joi.string().required(),
          roles: Joi.array().required(),
          permissions: Joi.object({
            is_admin: Joi.boolean().required(),
          }).unknown(),
        }).unknown(),
      }).validateAsync(body, { abortEarly: false });

      const alreadyExists = await getUser(options.email);
      if (alreadyExists) {
        throw Boom.conflict(`Unable to create, user ${options.email} already exists`);
      }

      const user = await createUser({ email: options.email, password }, options);
      await refreshUserPermissions(user);

      try {
        await mailer.sendEmail({ to: user.email, payload: { ...user, tmpPwd: password } }, "activation_user");
        return res.json(user);
      } catch (err) {
        await removeUser(user._id);
        throw Boom.internal("Unable to send activation_user email");
      }
    })
  );

  router.put(
    "/user/:userid",
    tryCatch(async ({ body, params }, res) => {
      const userid = params.userid;

      const rolesId = (await findRolesByNames(body.options.roles, { _id: 1 })).map(({ _id }) => _id);

      const options = body.options;

      await updateUser(userid, {
        is_admin: options.permissions.is_admin,
        email: options.email,
        prenom: options.prenom,
        nom: options.nom,
        roles: rolesId,
        acl: options.acl,
        invalided_token: true,
      });
      const user = await getUserById(userid);
      refreshUserPermissions(user);

      res.json({ ok: true, message: `User ${userid} updated !` });
    })
  );

  router.delete(
    "/user/:userid",
    tryCatch(async ({ params }, res) => {
      const userid = params.userid;

      await removeUser(userid);

      res.json({ ok: true, message: `User ${userid} deleted !` });
    })
  );

  return router;
};

// const mapUserToApiOutput = (user) => {
//   return {
//     id: user._id,
//     username: user.username,
//     email: user.email,
//     permissions: user.permissions,
//     network: user.network,
//     region: user.region,
//     organisme: user.organisme,
//     created_at: user.created_at,
//   };
// };

// router.get(
//   "/",
//   tryCatch(async (req, res) => {
//     const allUsers = await users.getAll();

//     const usersMapped = allUsers.map(mapUserToApiOutput);
//     return res.json(usersMapped);
//   })
// );

// router.get(
//   "/:id",
//   tryCatch(async (req, res) => {
//     const { id } = req.params;

//     if (id) {
//       const found = await users.getUserById(id);

//       if (!found)
//         return res.status(500).json({
//           status: "Error",
//           message: "User not found",
//         });

//       return res.json(mapUserToApiOutput(found));
//     } else {
//       return res.status(500).json({
//         status: "Error",
//         message: "User id null or undefined",
//       });
//     }
//   })
// );

// router.post(
//   "/search",
//   tryCatch(async (req, res) => {
//     const body = await Joi.object({
//       searchTerm: Joi.string().min(3),
//     }).validateAsync(req.body, { abortEarly: false });

//     const foundUsers = await users.searchUsers(body);
//     return res.json(foundUsers);
//   })
// );

// router.post(
//   "/",
//   tryCatch(async (req, res) => {
//     const { username, email, role, network, region, organisme } = await Joi.object({
//       username: Joi.string().required(),
//       email: Joi.string().required(),
//       role: Joi.string().valid(tdbRoles.pilot, tdbRoles.network).required(),
//       network: Joi.string(),
//       region: Joi.string(),
//       organisme: Joi.string(),
//     }).validateAsync(req.body, { abortEarly: false });

//     const createdUser = await users.createUser({
//       username,
//       email,
//       permissions: [role],
//       network: network || null,
//       region: region || null,
//       organisme: organisme || null,
//     });
//     return res.json(mapUserToApiOutput(createdUser));
//   })
// );

// router.post(
//   "/generate-update-password-url",
//   tryCatch(async (req, res) => {
//     const passwordUpdateToken = await users.generatePasswordUpdateToken(req.body.username);
//     const passwordUpdateUrl = `${config.publicUrl}/modifier-mot-de-passe?token=${passwordUpdateToken}`;

//     return res.json({ passwordUpdateUrl });
//   })
// );

// router.delete(
//   "/:username",
//   tryCatch(async (req, res) => {
//     const { username } = req.params;

//     if (username) {
//       const found = await users.getUser(username);

//       if (!found)
//         return res.status(500).json({
//           status: "Error",
//           message: "Username not found",
//         });

//       await users.removeUser(username);
//       return res.json({
//         status: "Success",
//         message: `User ${username} has been deleted `,
//       });
//     } else {
//       return res.status(500).json({
//         status: "Error",
//         message: "Username null or undefined",
//       });
//     }
//   })
// );

// router.put(
//   "/:id",
//   tryCatch(async (req, res) => {
//     const { id } = req.params;
//     const { username, email, role, network, region, organisme } = req.body;

//     if (id) {
//       const found = await users.getUserById(id);

//       if (!found)
//         return res.status(500).json({
//           status: "Error",
//           message: `User not found for id ${id}`,
//         });

//       await users.updateUser(id, { username, email, role, network, region, organisme });
//       return res.json({
//         status: "Success",
//         message: `User ${username} has been updated `,
//       });
//     } else {
//       return res.status(500).json({
//         status: "Error",
//         message: "Id is missing, can't find a user",
//       });
//     }
//   })
// );
