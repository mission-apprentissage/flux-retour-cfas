import express from "express";
import { zStatsPeriod, type StatsPeriod } from "shared/models/data/nationalStats.model";
import { z } from "zod";

import { getLbaTrainingLinksWithCustomUtm } from "@/common/actions/lba/lba.actions";
import {
  getTraitementStatsByMissionLocale,
  getSuiviTraitementByRegion,
  getSyntheseStats,
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
    "/stats/synthese",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
    returnResult(getSyntheseStatsRoute)
  );
  router.get(
    "/stats/traitement-ml",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        page: z.coerce.number().optional().default(1),
        limit: z.coerce.number().optional().default(10),
        sort_by: z.string().optional().default("total_jeunes"),
        sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
    }),
    returnResult(getTraitementStatsByMLRoute)
  );
  router.get(
    "/stats/traitement-regions",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
    returnResult(getTraitementStatsByRegionRoute)
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

const getSyntheseStatsRoute = async (req) => {
  const { period } = req.query;
  return await getSyntheseStats(period as StatsPeriod | undefined);
};

const getTraitementStatsByMLRoute = async (req) => {
  const { period, page, limit, sort_by, sort_order } = req.query;
  return await getTraitementStatsByMissionLocale({
    period: (period as StatsPeriod) || "30days",
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort_by: (sort_by as string) || "total_jeunes",
    sort_order: (sort_order as "asc" | "desc") || "desc",
  });
};

const getTraitementStatsByRegionRoute = async (req) => {
  const { period } = req.query;
  return await getSuiviTraitementByRegion(period as StatsPeriod | undefined);
};
