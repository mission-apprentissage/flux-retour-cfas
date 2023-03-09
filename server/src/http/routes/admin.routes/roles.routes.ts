import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware";
import Joi from "joi";
import { rolesDb } from "../../../common/model/collections";
import { createRole, findRoleById } from "../../../common/actions/roles.actions";

// TODO [tech]
export default () => {
  const router = express.Router();

  router.get(
    "/roles",
    tryCatch(async (req, res) => {
      const rolesList = await rolesDb().find({}).toArray();
      return res.json(rolesList || []);
    })
  );
  router.post(
    "/role",
    tryCatch(async ({ body }, res) => {
      const { name, acl } = await Joi.object({
        name: Joi.string().required(),
        acl: Joi.array().required(),
      }).validateAsync(body, { abortEarly: false });

      const roleId = await createRole({
        name,
        acl,
      });

      const role = await findRoleById(roleId);

      return res.json(role);
    })
  );

  // router.put(
  //   "/role/:name",
  //   tryCatch(async ({ body, params }, res) => {
  //     const name = params.name;

  //     let role = await Role.findOne({ name });
  //     if (!role) {
  //       throw new Error(`Unable to find Rôle ${role}`);
  //     }

  //     await Role.findOneAndUpdate(
  //       { _id: role._id },
  //       {
  //         acl: body.acl,
  //       },
  //       { new: true }
  //     );

  //     const allRoleUsers = await users.getUsers({ roles: { $in: [role._id] } });
  //     for (let index = 0; index < allRoleUsers.length; index++) {
  //       const user = allRoleUsers[index];
  //       await users.updateUser(user._id, { invalided_token: true });
  //     }

  //     res.json({ message: `Rôle ${name} updated !` });
  //   })
  // );

  // router.delete(
  //   "/role/:name",
  //   tryCatch(async ({ params }, res) => {
  //     const name = params.name;

  //     let role = await Role.findOne({ name });
  //     if (!role) {
  //       throw new Error(`Unable to find Rôle ${role}`);
  //     }

  //     await role.deleteOne({ name });

  //     const allRoleUsers = await users.getUsers({ roles: { $in: [role._id] } });
  //     for (let index = 0; index < allRoleUsers.length; index++) {
  //       const user = allRoleUsers[index];
  //       const roles = user.roles.filter((r) => r !== role._id);
  //       await users.updateUser(user._id, { invalided_token: true, roles });
  //     }

  //     res.json({ message: `Rôle ${name} deleted !` });
  //   })
  // );

  return router;
};
