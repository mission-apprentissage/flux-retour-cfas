import { ObjectId } from "bson";
import express from "express";
import { z } from "zod";

import {
  getTransmissionStatusByOrganismeGroupedByDate,
  getTransmissionStatusDetailsForAGivenDay,
} from "@/common/actions/indicateurs/transmissions/transmission.action";
import paginationSchema from "@/common/validation/paginationSchema";
import { extensions } from "@/common/validation/utils/zodPrimitives";
import { returnResult, requireOrganismePermission } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const pagination = paginationSchema({ defaultSort: "processed_at:-1" }).strict();
type Pagination = z.infer<typeof pagination>;

export default () => {
  const router = express.Router();

  router.get(
    "/",
    requireOrganismePermission("configurerModeTransmission"),
    validateRequestMiddleware({ query: pagination }),
    returnResult(getAllTransmissionsByDate)
  );
  router.get(
    "/:date",
    requireOrganismePermission("configurerModeTransmission"),
    validateRequestMiddleware({ params: z.object({ date: extensions.iso8601Date() }), query: pagination }),
    returnResult(getTransmissionByDate)
  );

  return router;
};

const getAllTransmissionsByDate = async (req, res) => {
  const { page, limit } = req.query as Pagination;
  const organismeId = res.locals.organismeId as ObjectId;
  const organismeIdString = organismeId.toString();
  return await getTransmissionStatusByOrganismeGroupedByDate(organismeIdString, page, limit);
};

const getTransmissionByDate = async (req, res) => {
  const { page, limit } = req.query as Pagination;
  const organismeId = res.locals.organismeId as ObjectId;
  const date = req.params.date as string;
  const organismeIdString = organismeId.toString();
  return await getTransmissionStatusDetailsForAGivenDay(organismeIdString, date, page, limit);
};
