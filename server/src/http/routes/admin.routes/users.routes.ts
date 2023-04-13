import express from "express";
import Boom from "boom";
import { z } from "zod";

import { getAllUsers, getDetailedUserById, removeUser, updateUser } from "../../../common/actions/users.actions.js";
import paginationShema from "../../../common/validation/paginationSchema.js";
import searchShema from "../../../common/validation/searchSchema.js";
import objectIdSchema from "../../../common/validation/objectIdSchema.js";
import userSchema from "../../../common/validation/userSchema.js";
import validateRequestMiddleware from "../../middlewares/validateRequestMiddleware.js";
import { getWarningOnEmail } from "../../../common/model/organisations.model.js";
import { returnResult } from "../../middlewares/helpers.js";
import { rejectMembre, validateMembre } from "../../../common/actions/organisations.actions.js";

const listSchema = paginationShema({ defaultSort: "created_at:-1" }).merge(searchShema()).strict();
type ListSchema = z.infer<typeof listSchema>;

export default () => {
  const router = express.Router();

  router.get(
    "/",
    validateRequestMiddleware({
      query: listSchema,
    }),
    async (req, res) => {
      const { page, limit, sort, q } = req.query as ListSchema; // eslint-disable-line
      // FIXME corrige temporairement un problème de $sort et valeurs par défaut
      // à supprimer après correction
      const result = await getAllUsers(q ? { $text: { $search: q } } : {});
      // const result = await getAllUsers(q ? { $text: { $search: q } } : {}, { page, limit, sort });
      return res.json(result);
    }
  );

  router.put(
    "/:id/validate",
    returnResult(async (req) => {
      await validateMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/:id/reject",
    returnResult(async (req) => {
      await rejectMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
      body: userSchema().strict(),
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
    "/:id",
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
    "/:id",
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
