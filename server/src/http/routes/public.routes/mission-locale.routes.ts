import express from "express";
import { zStatsPeriod } from "shared/models/data/nationalStats.model";
import { z } from "zod";

import {
  getTraitementStats,
  getDeploymentStats,
  getSyntheseRegionsStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { getAllARML, getAllMissionsLocales } from "@/common/actions/organisations.actions";
import { DefaultParams, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const traitementQuery = z.object({ period: zStatsPeriod.optional(), region: z.string().optional() });
const periodQuery = z.object({ period: zStatsPeriod.optional() });
type PublicHandler<TQuery> = RouteHandler<Record<string, unknown>, DefaultParams, TQuery>;

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllML));
  router.get("/arml", returnResult(getARML));
  router.get(
    "/stats/traitement",
    validateRequestMiddleware({ query: traitementQuery }),
    returnResult(getTraitementRoute)
  );
  router.get(
    "/stats/synthese/deployment",
    validateRequestMiddleware({ query: periodQuery }),
    returnResult(getDeploymentRoute)
  );
  router.get(
    "/stats/synthese/regions",
    validateRequestMiddleware({ query: periodQuery }),
    returnResult(getSyntheseRegionsRoute)
  );

  return router;
};

const getAllML = async () => {
  return await getAllMissionsLocales();
};

const getARML = async () => {
  return await getAllARML();
};

const getTraitementRoute: PublicHandler<z.infer<typeof traitementQuery>> = async (req) => {
  const { period, region } = req.query;
  return await getTraitementStats(period || "30days", undefined, region);
};

const getDeploymentRoute: PublicHandler<z.infer<typeof periodQuery>> = async (req) => {
  const { period } = req.query;
  return await getDeploymentStats(period || "30days");
};

const getSyntheseRegionsRoute: PublicHandler<z.infer<typeof periodQuery>> = async (req) => {
  const { period } = req.query;
  return await getSyntheseRegionsStats(period || "30days");
};
