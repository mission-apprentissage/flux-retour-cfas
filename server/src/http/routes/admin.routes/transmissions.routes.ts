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
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const pagination = paginationSchema({ defaultSort: "processed_at:-1" }).strict();
type Pagination = z.infer<typeof pagination>;

export default () => {
  const router = express.Router();

  router.get("/", validateRequestMiddleware({ query: pagination }), returnResult(getAllTransmissionsByDateAdmin));
  router.get(
    "/:date/error",
    validateRequestMiddleware({ params: z.object({ date: extensions.iso8601Date() }), query: pagination }),
    returnResult(getTransmissionByDateErrorAdmin)
  );

  return router;
};

const getAllTransmissionsByDateAdmin = async (req) => {
  const { page, limit } = req.query as Pagination;
  return await getAllTransmissionStatusGroupedByDate(page, limit);
};

const getTransmissionByDateErrorAdmin = async (req) => {
  const { page, limit } = req.query as Pagination;
  const date = req.params.date as Date;
  const formattedDate = formatDateYYYYMMDD(date);

  if (!formattedDate) {
    throw Boom.badRequest("Invalid date format. Please provide a valid ISO 8601 date string.");
  }

  return await getPaginatedErrorsTransmissionStatusGroupedByOrganismeForAGivenDay(formattedDate, page, limit);
};
