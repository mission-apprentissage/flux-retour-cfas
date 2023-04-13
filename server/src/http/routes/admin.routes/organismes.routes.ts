import express from "express";
import Boom from "boom";
import { z } from "zod";

import {
  findOrganismeById,
  getAllOrganismes,
  getDetailedOrganismeById,
  updateOrganisme,
} from "../../../common/actions/organismes/organismes.actions.js";
import paginationShema from "../../../common/validation/paginationSchema.js";
import searchShema from "../../../common/validation/searchSchema.js";
import objectIdSchema from "../../../common/validation/objectIdSchema.js";
import validateRequestMiddleware from "../../middlewares/validateRequestMiddleware.js";
import organismesFilterSchema from "../../../common/validation/organismesFilterSchema.js";

const listSchema = paginationShema({ defaultSort: "created_at:-1" })
  .merge(searchShema())
  .merge(organismesFilterSchema())
  .strict();
type ListSchema = z.infer<typeof listSchema>;

export default () => {
  const router = express.Router();

  router.get(
    "/",
    validateRequestMiddleware({
      query: listSchema,
    }),
    async (req, res) => {
      const { page, limit, sort, q, filter } = req.query as ListSchema;
      const query: any = filter || {};
      if (q) {
        query.$text = { $search: q };
      }

      const result = await getAllOrganismes(query, { page, limit, sort });
      if (result) {
        result.filter = filter;
      }
      return res.json(result);
    }
  );

  router.get(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;
      const organisme = await getDetailedOrganismeById(id);
      if (!organisme) {
        throw Boom.notFound(`Organisme with id ${id} not found`);
      }

      res.json(organisme);
    }
  );

  router.put(
    "/:id/hydrate",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;
      const organisme = await findOrganismeById(id);
      if (!organisme) {
        throw Boom.notFound(`Organisme with id ${id} not found`);
      }

      const updated = await updateOrganisme(organisme._id, organisme, {
        buildFormationTree: true,
        buildInfosFromSiret: true,
        callLbaApi: true,
      });

      res.json(updated);
    }
  );

  return router;
};
