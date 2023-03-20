import express from "express";
import Joi from "joi";
import Boom from "boom";

import { findOrganismeById } from "../../../common/actions/organismes/organismes.actions.js";
import {
  createUser,
  getAllUsers,
  getUserByEmail,
  getDetailedUserById,
  removeUser,
  updateUser,
} from "../../../common/actions/users.actions.js";
import { findRolesByNames } from "../../../common/actions/roles.actions.js";
import { updatePermissionsPending, removePermissions } from "../../../common/actions/permissions.actions.js";
import { refreshUserPermissions } from "../../../common/actions/users.afterCreate.actions.js";
import paginationShema from "../../../common/validation/paginationSchema.js";
import searchShema from "../../../common/validation/searchSchema.js";
import objectIdSchema from "../../../common/validation/objectIdSchema.js";
import userSchema from "../../../common/validation/userSchema.js";
import validateRequestMiddleware from "../../middlewares/validateRequestMiddleware.js";
import logger from "../../../common/logger.js";

export default ({ mailer }) => {
  const router = express.Router();

  router.get(
    "/users",
    validateRequestMiddleware({
      query: paginationShema({ defaultSort: "created_at:-1" }).merge(searchShema()).strict(),
    }),
    async (req, res) => {
      const { page, limit, sort, q } = req.query;
      const result = await getAllUsers(q ? { $text: { $search: q } } : {}, { page, limit, sort });
      return res.json(result);
    }
  );

  /**
   * Cette route confirme toutes les permissions d'un utilisateur pour un organisme.
   * Si organisme_id === "all", alors toutes les permissions de l'utilisateur sont confirmées.
   */
  router.get("/users/confirm-user", async ({ query }, res) => {
    const { userEmail, organisme_id, validate } = await Joi.object({
      userEmail: Joi.string().email().required(),
      organisme_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}|all$/, "invalid organisme_id")
        .required(),
      validate: Joi.boolean().required(),
    }).validateAsync(query, { abortEarly: false });

    const user = await getUserByEmail(userEmail);
    if (!user) {
      throw Boom.notFound(`User ${userEmail} not found`);
    }

    let organisme: any = null;
    if (organisme_id !== "all") {
      organisme = await findOrganismeById(organisme_id);
      if (organisme_id && !organisme) {
        throw Boom.notFound(`Organisme ${organisme_id} not found`);
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
  });

  router.post(
    "/users",
    validateRequestMiddleware({
      body: userSchema({ isNew: true }).strict(),
    }),
    async ({ body }, res) => {
      const { password, email, ...data } = body;
      const alreadyExists = await getUserByEmail(email);
      if (alreadyExists) {
        throw Boom.conflict(`Unable to create, user ${email} already exists`);
      }
      const user = await createUser({ email, password }, data);
      await refreshUserPermissions(user);
      try {
        await mailer.sendEmail({ to: user.email, payload: { ...user, tmpPwd: password } }, "activation_user");
        return res.json(user);
      } catch (err) {
        logger.error(`Error sending activation email ${err?.toString()}`);
        await removeUser(user._id);
        throw Boom.internal("Unable to send activation_user email");
      }
    }
  );

  router.put(
    "/users/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
      body: userSchema({ isNew: false }).strict(),
    }),
    async ({ body, params }, res) => {
      const { id } = params;

      const rolesId = (await findRolesByNames(body.roles, { _id: 1 })).map(({ _id }) => _id);

      await updateUser(id, {
        is_admin: body.is_admin,
        email: body.email,
        prenom: body.prenom,
        nom: body.nom,
        roles: rolesId,
        invalided_token: true,
      });
      const user = await getDetailedUserById(id);
      if (!user) {
        throw Boom.notFound(`User with id ${id} not found`);
      }

      refreshUserPermissions(user);

      res.json({ ok: true, message: `User ${id} updated !` });
    }
  );

  router.get(
    "/users/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;
      const user = await getDetailedUserById(id);
      if (!user) {
        throw Boom.notFound(`User with id ${id} not found`);
      }

      res.json(user);
    }
  );

  router.delete(
    "/users/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;

      await removeUser(id);

      res.json({ ok: true, message: `User ${id} deleted !` });
    }
  );

  return router;
};
