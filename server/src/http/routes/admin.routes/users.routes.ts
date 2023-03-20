import express from "express";
import Boom from "boom";

import { getAllUsers, getDetailedUserById, removeUser, updateUser } from "../../../common/actions/users.actions.js";
import paginationShema from "../../../common/validation/paginationSchema.js";
import searchShema from "../../../common/validation/searchSchema.js";
import objectIdSchema from "../../../common/validation/objectIdSchema.js";
import userSchema from "../../../common/validation/userSchema.js";
import validateRequestMiddleware from "../../middlewares/validateRequestMiddleware.js";
import { getWarningOnEmail } from "../../../common/model/organisations.model.js";
import { returnResult } from "../../middlewares/helpers.js";
import { rejectMembre, validateMembre } from "../../../common/actions/organisations.actions.js";

export default () => {
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

  router.put(
    "/users/:id/validate",
    returnResult(async (req) => {
      await validateMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/users/:id/reject",
    returnResult(async (req) => {
      await rejectMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/users/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
      body: userSchema({ isNew: false }).strict(),
    }),
    async ({ body, params }, res) => {
      const { id } = params;

      // FIXME : mise à jour de l'organisation ?
      await updateUser(id, {
        ...body,
        invalided_token: true,
      });
      const user = await getDetailedUserById(id);
      if (!user) {
        throw Boom.notFound(`User with id ${id} not found`);
      }

      res.json({ ok: true });
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

      let warning = getWarningOnEmail(user.email, user.organisation);

      res.json({ user, warning });
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
