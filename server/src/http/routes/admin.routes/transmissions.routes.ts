import express from "express";
import { extensions } from "shared/models/data/zodPrimitives";
import { z } from "zod";

import {
  getAllTransmissionStatusGroupedByDate,
  getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay,
} from "@/common/actions/indicateurs/transmissions/transmission.action";
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
  const date = req.params.date as string;
  return await getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay(date, page, limit);
};
