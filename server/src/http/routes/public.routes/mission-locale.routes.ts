import express from "express";
import { zStatsPeriod, zStatsSegment } from "shared/models/data/nationalStats.model";
import { z } from "zod";

import { getCollaborationsCfaSynthese } from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import {
  getCollaborationSegmentStats,
  getDeploymentStats,
  getDossiersTraitesStats,
  getRupturantsStats,
  getSyntheseRegionsStats,
  getTraitementStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { getAllARML, getAllMissionsLocales } from "@/common/actions/organisations.actions";
import { DefaultParams, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const PUBLIC_STATS_CACHE_SECONDS = 300;

const segmentQuery = z.object({ period: zStatsPeriod.optional(), segment: zStatsSegment.optional() }).strict();
const periodQuery = z.object({ period: zStatsPeriod.optional() });
const strictPeriodQuery = periodQuery.strict();
const emptyQuery = z.object({}).strict();
type PublicHandler<TQuery> = RouteHandler<Record<string, unknown>, DefaultParams, TQuery>;

const publicStatsCache: express.RequestHandler = (_req, res, next) => {
  res.set("Cache-Control", `public, max-age=${PUBLIC_STATS_CACHE_SECONDS}`);
  next();
};

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllML));
  router.get("/arml", returnResult(getARML));
  router.get(
    "/stats/traitement",
    validateRequestMiddleware({ query: segmentQuery }),
    publicStatsCache,
    returnResult(getTraitementRoute)
  );
  router.get(
    "/stats/rupturants",
    validateRequestMiddleware({ query: segmentQuery }),
    publicStatsCache,
    returnResult(getRupturantsRoute)
  );
  router.get(
    "/stats/dossiers-traites",
    validateRequestMiddleware({ query: segmentQuery }),
    publicStatsCache,
    returnResult(getDossiersTraitesRoute)
  );
  router.get(
    "/stats/collaborations",
    validateRequestMiddleware({ query: strictPeriodQuery }),
    publicStatsCache,
    returnResult(getCollaborationsRoute)
  );
  router.get(
    "/stats/synthese/deployment",
    validateRequestMiddleware({ query: periodQuery }),
    publicStatsCache,
    returnResult(getDeploymentRoute)
  );
  router.get(
    "/stats/synthese/regions",
    validateRequestMiddleware({ query: periodQuery }),
    publicStatsCache,
    returnResult(getSyntheseRegionsRoute)
  );
  router.get(
    "/stats/synthese/collaborations-cfa",
    validateRequestMiddleware({ query: emptyQuery }),
    publicStatsCache,
    returnResult(getCollaborationsCfaRoute)
  );

  return router;
};

const getAllML = async () => {
  return await getAllMissionsLocales();
};

const getARML = async () => {
  return await getAllARML();
};

const getTraitementRoute: PublicHandler<z.infer<typeof segmentQuery>> = async (req) => {
  const { period, segment } = req.query;
  return await getTraitementStats(period || "30days", undefined, undefined, segment || "rupture");
};

const getRupturantsRoute: PublicHandler<z.infer<typeof segmentQuery>> = async (req) => {
  const { period, segment } = req.query;
  return await getRupturantsStats(period || "30days", undefined, undefined, segment || "rupture");
};

const getDossiersTraitesRoute: PublicHandler<z.infer<typeof segmentQuery>> = async (req) => {
  const { period, segment } = req.query;
  return await getDossiersTraitesStats(period || "30days", undefined, undefined, segment || "rupture");
};

const getCollaborationsRoute: PublicHandler<z.infer<typeof strictPeriodQuery>> = async (req) => {
  const { period } = req.query;
  return await getCollaborationSegmentStats(period || "30days");
};

const getDeploymentRoute: PublicHandler<z.infer<typeof periodQuery>> = async (req) => {
  const { period } = req.query;
  return await getDeploymentStats(period || "30days");
};

const getSyntheseRegionsRoute: PublicHandler<z.infer<typeof periodQuery>> = async (req) => {
  const { period } = req.query;
  return await getSyntheseRegionsStats(period || "30days");
};

const getCollaborationsCfaRoute = async () => {
  return await getCollaborationsCfaSynthese();
};
