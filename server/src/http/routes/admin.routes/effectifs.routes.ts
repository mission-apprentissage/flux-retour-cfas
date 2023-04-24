import Boom from "boom";
import express from "express";
import { z } from "zod";

import { getAllEffectifs, getDetailedEffectifById } from "@/common/actions/effectifs/effectifs.actions";
import effectifsFilterSchema from "@/common/validation/effectifsFilterSchema";
import objectIdSchema from "@/common/validation/objectIdSchema";
import paginationShema from "@/common/validation/paginationSchema";
import searchShema from "@/common/validation/searchSchema";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const listSchema = paginationShema({ defaultSort: "created_at:-1" })
  .merge(searchShema())
  .merge(effectifsFilterSchema())
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

      const result = await getAllEffectifs(query, { page, limit, sort });
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
      const organisme = await getDetailedEffectifById(id);
      if (!organisme) {
        throw Boom.notFound(`Effectifs with id ${id} not found`);
      }

      res.json(organisme);
    }
  );

  return router;
};
