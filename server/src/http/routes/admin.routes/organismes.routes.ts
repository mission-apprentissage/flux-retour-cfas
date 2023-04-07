import express from "express";
import Boom from "boom";

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

export default () => {
  const router = express.Router();

  router.get(
    "/organismes",
    validateRequestMiddleware({
      query: paginationShema({ defaultSort: "created_at:-1" })
        .merge(searchShema())
        .merge(organismesFilterSchema())
        .strict(),
    }),
    async (req, res) => {
      const { page, limit, sort, q, filter } = req.query as any;
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
    "/organismes/:id",
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
    "/organismes/:id/hydrate",
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
