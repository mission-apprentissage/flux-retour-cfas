import Boom from "boom";
import express from "express";
import { z } from "zod";

import { rejectMembre, validateMembre } from "@/common/actions/organisations.actions";
import {
  getAllUsers,
  getDetailedUserById,
  removeUser,
  resendConfirmationEmail,
  updateUser,
} from "@/common/actions/users.actions";
import { getWarningOnEmail } from "@/common/model/organisations.model";
import objectIdSchema from "@/common/validation/objectIdSchema";
import paginationShema from "@/common/validation/paginationSchema";
import searchShema from "@/common/validation/searchSchema";
import userSchema from "@/common/validation/userSchema";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

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
      const { page, limit, sort, q } = req.query as ListSchema;
      const query: any = {};
      if (q) {
        query.$text = { $search: q };
      }

      const result = await getAllUsers(query, { page, limit, sort });
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

  router.post(
    "/:id/resend-confirmation-email",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    returnResult(async (req) => {
      await resendConfirmationEmail(req.params.id as string);
    })
  );

  return router;
};
