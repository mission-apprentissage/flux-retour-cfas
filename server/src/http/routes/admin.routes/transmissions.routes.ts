import Boom from "boom";
import express from "express";
import { extensions } from "shared/models/parts/zodPrimitives";
import { z } from "zod";

import {
  getAllTransmissionStatusGroupedByDate,
  getPaginatedErrorsTransmissionStatusGroupedByOrganismeForAGivenDay,
} from "@/common/actions/indicateurs/transmissions/transmission.action";
import { formatDateYYYYMMDD } from "@/common/utils/dateUtils";
import paginationSchema from "@/common/validation/paginationSchema";
import { DefaultParams, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const pagination = paginationSchema({ defaultSort: "processed_at:-1" }).strict();
type Pagination = z.infer<typeof pagination>;
const dateParams = z.object({ date: extensions.iso8601Date() });
type DateParams = z.infer<typeof dateParams>;

export default () => {
  const router = express.Router();

  router.get("/", validateRequestMiddleware({ query: pagination }), returnResult(getAllTransmissionsByDateAdmin));
  router.get(
    "/:date/error",
    validateRequestMiddleware({ params: dateParams, query: pagination }),
    returnResult(getTransmissionByDateErrorAdmin)
  );

  return router;
};

const getAllTransmissionsByDateAdmin: RouteHandler<Record<string, unknown>, DefaultParams, Pagination> = async (
  req
) => {
  const { page, limit } = req.query;
  return await getAllTransmissionStatusGroupedByDate(page, limit);
};

const getTransmissionByDateErrorAdmin: RouteHandler<Record<string, unknown>, DateParams, Pagination> = async (req) => {
  const { page, limit } = req.query;
  const date = req.params.date;
  const formattedDate = formatDateYYYYMMDD(date);

  if (!formattedDate) {
    throw Boom.badRequest("Invalid date format. Please provide a valid ISO 8601 date string.");
  }

  return await getPaginatedErrorsTransmissionStatusGroupedByOrganismeForAGivenDay(formattedDate, page, limit);
};
