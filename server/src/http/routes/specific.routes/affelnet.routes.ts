import express from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getAffelnetVoeuxByOrganisme } from "@/common/actions/affelnet.actions";
//import parentLogger from "@/common/logger";
import paginationSchema from "@/common/validation/paginationSchema";
import { requireOrganismePermission, returnResult } from "@/http/middlewares/helpers";
// import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

// const logger = parentLogger.child({
//   module: "affelnet-route",
// });

const pagination = paginationSchema({ defaultSort: "_id" }).strict();
type Pagination = z.infer<typeof pagination>;

export default () => {
  const router = express.Router();

  router.get(
    "/",
    requireOrganismePermission("manageEffectifs"),
    //validateRequestMiddleware({ query: pagination }),
    returnResult(getAffelnetVoeux)
  );

  return router;
};

const getAffelnetVoeux = (req, res) => {
  const { page, limit } = req.query as Pagination;
  const organismeId = res.locals.organismeId as ObjectId;
  return getAffelnetVoeuxByOrganisme(organismeId, Number(page), Number(limit));
};
