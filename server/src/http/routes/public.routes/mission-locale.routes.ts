import express from "express";
import { zStatsPeriod, StatsPeriod } from "shared/models/data/nationalStats.model";
import { z } from "zod";

import {
  getTraitementStats,
  getDeploymentStats,
  getSyntheseRegionsStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { getAllARML, getAllMissionsLocales } from "@/common/actions/organisations.actions";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllML));
  router.get("/arml", returnResult(getARML));

  router.get(
    "/stats/traitement",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        region: z.string().optional(),
      }),
    }),
    returnResult(getTraitementRoute)
  );

  router.get(
    "/stats/synthese/deployment",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
    returnResult(getDeploymentRoute)
  );

  router.get(
    "/stats/synthese/regions",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
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

const getTraitementRoute = async (req) => {
  const { period, region } = req.query;
  return await getTraitementStats((period as StatsPeriod) || "30days", undefined, region as string | undefined);
};

const getDeploymentRoute = async (req) => {
  const { period } = req.query;
  return await getDeploymentStats((period as StatsPeriod) || "30days");
};

const getSyntheseRegionsRoute = async (req) => {
  const { period } = req.query;
  return await getSyntheseRegionsStats((period as StatsPeriod) || "30days");
};
