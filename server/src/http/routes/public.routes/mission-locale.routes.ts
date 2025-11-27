import express from "express";
import { zStatsPeriod, StatsPeriod } from "shared/models/data/nationalStats.model";
import { z } from "zod";

import { getLbaTrainingLinksWithCustomUtm } from "@/common/actions/lba/lba.actions";
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
    "/lba",
    validateRequestMiddleware({
      query: z.object({
        utm_source: z.string(),
        utm_medium: z.string(),
        utm_campaign: z.string(),
        rncp: z.string().optional(),
        cfd: z.string().optional(),
      }),
    }),
    getLbaLink
  );

  router.get(
    "/stats/traitement",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
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

const getLbaLink = async (req, res, next) => {
  try {
    const { utm_campaign, utm_medium, utm_source, rncp, cfd } = req.query;
    const lbaUrl = await getLbaTrainingLinksWithCustomUtm(cfd, rncp, {
      source: utm_source,
      medium: utm_medium,
      campaign: utm_campaign,
    });

    res.redirect(302, lbaUrl);
  } catch (error) {
    next(error);
  }
};

const getTraitementRoute = async (req) => {
  const { period } = req.query;
  return await getTraitementStats((period as StatsPeriod) || "30days");
};

const getDeploymentRoute = async (req) => {
  const { period } = req.query;
  return await getDeploymentStats((period as StatsPeriod) || "30days");
};

const getSyntheseRegionsRoute = async (req) => {
  const { period } = req.query;
  return await getSyntheseRegionsStats((period as StatsPeriod) || "30days");
};
