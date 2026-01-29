import express from "express";
import { ObjectId } from "mongodb";
import { extensions } from "shared/models/parts/zodPrimitives";
import { z } from "zod";

import {
  getTransmissionStatusByOrganismeGroupedByDate,
  getErrorsTransmissionStatusDetailsForAGivenDay,
  getSuccessfulTransmissionStatusDetailsForAGivenDay,
} from "@/common/actions/indicateurs/transmissions/transmission.action";
import { updateOrganisme } from "@/common/actions/organismes/organismes.actions";
import paginationSchema from "@/common/validation/paginationSchema";
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
    "/:date/error",
    requireOrganismePermission("configurerModeTransmission"),
    validateRequestMiddleware({ params: z.object({ date: extensions.iso8601Date() }), query: pagination }),
    returnResult(getTransmissionByDateError)
  );
  router.get(
    "/:date/success",
    requireOrganismePermission("configurerModeTransmission"),
    validateRequestMiddleware({ params: z.object({ date: extensions.iso8601Date() }), query: pagination }),
    returnResult(getTransmissionByDateSuccess)
  );
  router.put(
    "/reset-notification",
    requireOrganismePermission("configurerModeTransmission"),
    returnResult(async (req, res) => {
      await updateOrganisme(res.locals.organismeId, {
        has_transmission_errors: false,
      });
    })
  );

  return router;
};

const getAllTransmissionsByDate = async (req, res) => {
  const { page, limit } = req.query as Pagination;
  const organismeId = res.locals.organismeId as ObjectId;
  const organismeIdString = organismeId.toString();
  return await getTransmissionStatusByOrganismeGroupedByDate(organismeIdString, page, limit);
};

const getTransmissionByDateError = async (req, res) => {
  const { page, limit } = req.query as Pagination;
  const organismeId = res.locals.organismeId as ObjectId;
  const date = req.params.date as string;
  const organismeIdString = organismeId.toString();
  return await getErrorsTransmissionStatusDetailsForAGivenDay(organismeIdString, date, page, limit);
};

const getTransmissionByDateSuccess = async (req, res) => {
  const { page, limit } = req.query as Pagination;
  const organismeId = res.locals.organismeId as ObjectId;
  const date = req.params.date as string;
  const organismeIdString = organismeId.toString();
  return await getSuccessfulTransmissionStatusDetailsForAGivenDay(organismeIdString, date, page, limit);
};
