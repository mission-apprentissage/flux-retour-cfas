import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import Joi from "joi";
// import Boom from "boom";
// import config from "../../../config.js";
// import { createActivationToken } from "../../../common/utils/jwtUtils.js";
import {
  // createUser,
  getAllUsers,
  // getUser,
  removeUser,
  searchUsers,
  structureUser,
  updateUser,
} from "../../../common/components/usersComponent.js";
import { findRoleById, findRolesByNames } from "../../../common/components/rolesComponent.js";

// TODO
// eslint-disable-next-line no-unused-vars
export default ({ mailer }) => {
  const router = express.Router();

  router.get(
    "/users",
    tryCatch(async (req, res) => {
      let usersList = await getAllUsers();
      for (let index = 0; index < usersList.length; index++) {
        const user = usersList[index];
        for (let j = 0; j < user.roles.length; j++) {
          const roleId = user.roles[j];

          const roleName = await findRoleById(roleId, { name: 1 });
          user.roles[j] = roleName.name;
        }
      }

      return res.json(usersList);
    })
  );

  // router.post(
  //   "/user",
  //   tryCatch(async ({ body }, res) => {
  //     const { password, options } = await Joi.object({
  //       password: Joi.string().required(),
  //       options: Joi.object({
  //         prenom: Joi.string().required(),
  //         nom: Joi.string().required(),
  //         email: Joi.string().required(),
  //         roles: Joi.array().required(),
  //         permissions: Joi.object({
  //           is_admin: Joi.boolean().required(),
  //         }).unknown(),
  //       }).unknown(),
  //     }).validateAsync(body, { abortEarly: false });

  //     const alreadyExists = await getUser(options.email);
  //     if (alreadyExists) {
  //       throw Boom.conflict(`Unable to create, user ${options.email} already exists`);
  //     }

  //     const user = await createUser(options.email, password, options);

  //     await mailer.sendEmail(user.email, `[${config.env} Contrat publique apprentissage] Bienvenue`, "grettings", {
  //       username: user.username,
  //       civility: user.civility,
  //       tmpPwd: password,
  //       activationToken: createActivationToken(user.email.toLowerCase(), { payload: { tmpPwd: password } }),
  //       publicUrl: config.publicUrl,
  //     });

  //     return res.json(user);
  //   })
  // );

  router.put(
    "/user/:userid",
    tryCatch(async ({ body, params }, res) => {
      const userid = params.userid;

      let rolesId = await findRolesByNames(body.options.roles, { _id: 1 });
      rolesId = rolesId.map(({ _id }) => _id.toString());

      await updateUser(userid, {
        is_admin: body.options.permissions.is_admin,
        email: body.options.email,
        prenom: body.options.prenom,
        nom: body.options.nom,
        roles: rolesId,
        acl: body.options.acl,
        invalided_token: true,
      });

      res.json({ message: `User ${userid} updated !` });
    })
  );

  router.delete(
    "/user/:userid",
    tryCatch(async ({ params }, res) => {
      const userid = params.userid;

      await removeUser(userid);

      res.json({ message: `User ${userid} deleted !` });
    })
  );

  router.post(
    "/search",
    tryCatch(async ({ body }, res) => {
      const { searchTerm } = await Joi.object({
        searchTerm: Joi.string().min(3),
      }).validateAsync(body, { abortEarly: false });

      const foundUsers = await searchUsers(searchTerm);
      const usersMapped = await Promise.all(foundUsers.map(async (u) => await structureUser(u)));
      return res.json(usersMapped);
    })
  );

  return router;
};
