import express from "express";
import { z } from "zod";

import { getLbaTrainingLinksWithCustomUtm } from "@/common/actions/lba/lba.actions";
import { getSummaryStats, getRegionalStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
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
    "/stats/summary",
    validateRequestMiddleware({
      query: z.object({
        period: z.enum(["30days", "3months", "all"]).optional(),
      }),
    }),
    returnResult(getSummaryStatsRoute)
  );
  router.get(
    "/stats/regions",
    validateRequestMiddleware({
      query: z.object({
        period: z.enum(["30days", "3months", "all"]).optional(),
      }),
    }),
    returnResult(getRegionalStatsRoute)
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

const getSummaryStatsRoute = async (req) => {
  const { period } = req.query;
  return getSummaryStats(new Date(), period as "30days" | "3months" | "all" | undefined);
};

const getRegionalStatsRoute = async (req) => {
  const { period } = req.query;
  return await getRegionalStats(period as "30days" | "3months" | "all" | undefined);
};
