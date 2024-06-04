import express from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getAffelnetVoeuxByOrganisme } from "@/common/actions/affelnet.actions";
import { requireOrganismePermission, returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const Sort = ["nom", "prenom", "rang", "formation"] as const;
const Direction = ["ASC", "DESC"] as const;

const customPagination = z.object({
  page: z.coerce.number().positive().max(10000).default(1),
  limit: z.coerce.number().positive().max(10000).default(10),
  sort: z.enum(Sort),
  direction: z.enum(Direction),
});
type Pagination = z.infer<typeof customPagination>;

export default () => {
  const router = express.Router();

  router.get(
    "/",
    requireOrganismePermission("manageEffectifs"),
    validateRequestMiddleware({ query: customPagination }),
    returnResult(getAffelnetVoeux)
  );

  return router;
};

const getAffelnetVoeux = (req, res) => {
  const { page, limit, sort, direction } = req.query as Pagination;
  const organismeId = res.locals.organismeId as ObjectId;
  return getAffelnetVoeuxByOrganisme(organismeId, Number(page), Number(limit), sort, direction);
};
