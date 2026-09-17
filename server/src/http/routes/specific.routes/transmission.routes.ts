import express from "express";
import { extensions } from "shared/models/parts/zodPrimitives";
import { z } from "zod";

import {
  getTransmissionStatusByOrganismeGroupedByDate,
  getErrorsTransmissionStatusDetailsForAGivenDay,
  getSuccessfulTransmissionStatusDetailsForAGivenDay,
} from "@/common/actions/indicateurs/transmissions/transmission.action";
import { updateOrganisme } from "@/common/actions/organismes/organismes.actions";
import paginationSchema from "@/common/validation/paginationSchema";
import {
  DefaultParams,
  OrganismeLocals,
  returnResult,
  requireOrganismePermission,
  RouteHandler,
} from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const pagination = paginationSchema({ defaultSort: "processed_at:-1" }).strict();
type Pagination = z.infer<typeof pagination>;
const dateParams = z.object({ date: extensions.iso8601Date() });
type DateParams = z.infer<typeof dateParams>;

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
    validateRequestMiddleware({ params: dateParams, query: pagination }),
    returnResult(getTransmissionByDateError)
  );
  router.get(
    "/:date/success",
    requireOrganismePermission("configurerModeTransmission"),
    validateRequestMiddleware({ params: dateParams, query: pagination }),
    returnResult(getTransmissionByDateSuccess)
  );
  router.put(
    "/reset-notification",
    requireOrganismePermission("configurerModeTransmission"),
    returnResult<OrganismeLocals>(async (req, res) => {
      await updateOrganisme(res.locals.organismeId, {
        has_transmission_errors: false,
      });
    })
  );

  return router;
};

const getAllTransmissionsByDate: RouteHandler<OrganismeLocals, DefaultParams, Pagination> = async (req, res) => {
  const { page, limit } = req.query;
  const organismeIdString = res.locals.organismeId.toString();
  return await getTransmissionStatusByOrganismeGroupedByDate(organismeIdString, page, limit);
};

const getTransmissionByDateError: RouteHandler<OrganismeLocals, DateParams, Pagination> = async (req, res) => {
  const { page, limit } = req.query;
  const organismeIdString = res.locals.organismeId.toString();
  return await getErrorsTransmissionStatusDetailsForAGivenDay(organismeIdString, req.params.date, page, limit);
};

const getTransmissionByDateSuccess: RouteHandler<OrganismeLocals, DateParams, Pagination> = async (req, res) => {
  const { page, limit } = req.query;
  const organismeIdString = res.locals.organismeId.toString();
  return await getSuccessfulTransmissionStatusDetailsForAGivenDay(organismeIdString, req.params.date, page, limit);
};
