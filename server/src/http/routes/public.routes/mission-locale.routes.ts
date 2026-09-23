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
import { tryCachedExecution } from "@/common/utils/cacheUtils";
import { DefaultParams, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const PUBLIC_STATS_CACHE_SECONDS = 300;

const segmentQuery = z.object({ period: zStatsPeriod.optional(), segment: zStatsSegment.optional() }).strict();
const periodQuery = z.object({ period: zStatsPeriod.optional() });
const strictPeriodQuery = periodQuery.strict();
const emptyQuery = z.object({}).strict();
type PublicHandler<TQuery> = RouteHandler<Record<string, unknown>, DefaultParams, TQuery>;

const withPublicCache =
  <TQuery>(handler: PublicHandler<TQuery>): PublicHandler<TQuery> =>
  async (req, res, next) => {
    const result = await handler(req, res, next);
    res.set("Cache-Control", `public, max-age=${PUBLIC_STATS_CACHE_SECONDS}`);
    return result;
  };

/**
 * Les lecteurs publics sont anonymes et coûteux (série temporelle, distinct sur les collabs, scan des
 * organismes éligibles) : leur résultat est mémoïsé en mémoire pour la même durée que le Cache-Control.
 */
const cachedPublicStats = <T>(route: string, params: Record<string, string | undefined>, compute: () => Promise<T>) =>
  tryCachedExecution(
    `public-stats:${route}:${Object.values(params).join(":")}`,
    PUBLIC_STATS_CACHE_SECONDS * 1000,
    compute
  );

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllML));
  router.get("/arml", returnResult(getARML));
  router.get(
    "/stats/traitement",
    validateRequestMiddleware({ query: segmentQuery }),
    returnResult(withPublicCache(getTraitementRoute))
  );
  router.get(
    "/stats/rupturants",
    validateRequestMiddleware({ query: segmentQuery }),
    returnResult(withPublicCache(getRupturantsRoute))
  );
  router.get(
    "/stats/dossiers-traites",
    validateRequestMiddleware({ query: segmentQuery }),
    returnResult(withPublicCache(getDossiersTraitesRoute))
  );
  router.get(
    "/stats/collaborations",
    validateRequestMiddleware({ query: strictPeriodQuery }),
    returnResult(withPublicCache(getCollaborationsRoute))
  );
  router.get(
    "/stats/synthese/deployment",
    validateRequestMiddleware({ query: periodQuery }),
    returnResult(withPublicCache(getDeploymentRoute))
  );
  router.get(
    "/stats/synthese/regions",
    validateRequestMiddleware({ query: periodQuery }),
    returnResult(withPublicCache(getSyntheseRegionsRoute))
  );
  router.get(
    "/stats/synthese/collaborations-cfa",
    validateRequestMiddleware({ query: emptyQuery }),
    returnResult(withPublicCache(getCollaborationsCfaRoute))
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
  const period = req.query.period || "30days";
  const segment = req.query.segment || "rupture";
  return await cachedPublicStats("traitement", { period, segment }, () =>
    getTraitementStats(period, undefined, undefined, segment)
  );
};

const getRupturantsRoute: PublicHandler<z.infer<typeof segmentQuery>> = async (req) => {
  const period = req.query.period || "30days";
  const segment = req.query.segment || "rupture";
  return await cachedPublicStats("rupturants", { period, segment }, () =>
    getRupturantsStats(period, undefined, undefined, segment)
  );
};

const getDossiersTraitesRoute: PublicHandler<z.infer<typeof segmentQuery>> = async (req) => {
  const period = req.query.period || "30days";
  const segment = req.query.segment || "rupture";
  return await cachedPublicStats("dossiers-traites", { period, segment }, () =>
    getDossiersTraitesStats(period, undefined, undefined, segment)
  );
};

const getCollaborationsRoute: PublicHandler<z.infer<typeof strictPeriodQuery>> = async (req) => {
  const period = req.query.period || "30days";
  return await cachedPublicStats("collaborations", { period }, () => getCollaborationSegmentStats(period));
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
  return await cachedPublicStats("synthese-collaborations-cfa", {}, () => getCollaborationsCfaSynthese());
};
