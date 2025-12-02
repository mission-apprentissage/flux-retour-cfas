import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { StatsPeriod, zStatsPeriod } from "shared/models/data/nationalStats.model";
import { getRegionsFromOrganisation, OrganisationWithRegions } from "shared/utils/organisationRegions";
import { z } from "zod";

import {
  getMissionLocaleDetail,
  getMissionLocaleMembers,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import {
  getRupturantsStats,
  getDossiersTraitesStats,
  getTraitementStatsByMissionLocale,
  getSuiviTraitementByRegion,
  getAccompagnementConjointStats,
  getTraitementStats,
  getDeploymentStats,
  getSyntheseStats,
  getSyntheseRegionsStats,
  getCouvertureRegionsStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { organisationsDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export type { OrganisationWithRegions };

export default () => {
  const router = express.Router();

  router.get(
    "/synthese",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
    returnResult(getSyntheseRoute)
  );

  router.get(
    "/synthese/deployment",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
    returnResult(getDeploymentRoute)
  );

  router.get(
    "/synthese/regions",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
      }),
    }),
    returnResult(getSyntheseRegionsRoute)
  );

  router.get(
    "/traitement",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        region: z.string().optional(),
      }),
    }),
    returnResult(getTraitementRoute)
  );

  router.get(
    "/stats/rupturants",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        region: z.string().optional(),
        ml_id: z
          .string()
          .regex(/^[0-9a-f]{24}$/)
          .optional(),
        national: z.coerce.boolean().optional(),
      }),
    }),
    returnResult(getRupturantsRoute)
  );

  router.get(
    "/stats/dossiers-traites",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        region: z.string().optional(),
        ml_id: z
          .string()
          .regex(/^[0-9a-f]{24}$/)
          .optional(),
        national: z.coerce.boolean().optional(),
      }),
    }),
    returnResult(getDossiersTraitesRoute)
  );

  router.get(
    "/stats/traitement/ml",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        region: z.string().optional(),
        page: z.coerce.number().min(1).optional().default(1),
        limit: z.coerce.number().min(1).max(100).optional().default(10),
        sort_by: z.string().optional().default("total_jeunes"),
        sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
        search: z.string().optional(),
      }),
    }),
    returnResult(getTraitementMLRoute)
  );

  router.get(
    "/stats/traitement/regions",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        national: z.coerce.boolean().optional(),
      }),
    }),
    returnResult(getTraitementRegionsRoute)
  );

  router.get(
    "/stats/couverture-regions",
    validateRequestMiddleware({
      query: z.object({
        period: zStatsPeriod.optional(),
        national: z.coerce.boolean().optional(),
      }),
    }),
    returnResult(getCouvertureRegionsRoute)
  );

  router.get(
    "/stats/accompagnement-conjoint",
    validateRequestMiddleware({
      query: z.object({
        region: z.string().optional(),
        national: z.coerce.boolean().optional(),
      }),
    }),
    returnResult(getAccompagnementConjointRoute)
  );

  router.get(
    "/mission-locale/:id/detail",
    validateRequestMiddleware({
      params: z.object({
        id: z.string().regex(/^[0-9a-f]{24}$/),
      }),
    }),
    returnResult(getMlDetailRoute)
  );

  router.get(
    "/mission-locale/:id/membres",
    validateRequestMiddleware({
      params: z.object({
        id: z.string().regex(/^[0-9a-f]{24}$/),
      }),
    }),
    returnResult(getMlMembresRoute)
  );

  return router;
};

const getSyntheseRoute = async (req, { locals }) => {
  const { period } = req.query;
  const regions = locals.regions as string[];

  const stats = await getSyntheseStats((period as StatsPeriod) || "30days");

  if (regions.length > 0) {
    stats.regions = stats.regions.filter((r) => regions.includes(r.code));
  }

  return stats;
};

const getDeploymentRoute = async (req, { locals }) => {
  const { period } = req.query;
  const regions = locals.regions as string[];

  const stats = await getDeploymentStats((period as StatsPeriod) || "30days");

  if (regions.length > 0) {
    stats.regionsActives = stats.regionsActives.filter((code) => regions.includes(code));
  }

  return stats;
};

const getSyntheseRegionsRoute = async (req, { locals }) => {
  const { period } = req.query;
  const regions = locals.regions as string[];

  const stats = await getSyntheseRegionsStats((period as StatsPeriod) || "30days");

  if (regions.length > 0) {
    stats.regions = stats.regions.filter((r) => regions.includes(r.code));
  }

  return stats;
};

const getTraitementRoute = async (req, { locals }) => {
  const { period, region } = req.query;
  const userRegions = locals.regions as string[];

  if (region && userRegions.length > 0 && !userRegions.includes(region as string)) {
    throw Boom.forbidden("Accès non autorisé à cette région");
  }

  const targetRegion = region || (userRegions.length === 1 ? userRegions[0] : undefined);

  return await getTraitementStats((period as StatsPeriod) || "30days", undefined, targetRegion as string | undefined);
};

const getRupturantsRoute = async (req, { locals }) => {
  const { period, region, ml_id, national } = req.query;
  const userRegions = locals.regions as string[];

  if (region && userRegions.length > 0 && !userRegions.includes(region as string)) {
    throw Boom.forbidden("Accès non autorisé à cette région");
  }

  if (ml_id) {
    await verifyMlInRegions(ml_id as string, userRegions);
  }

  if (national) {
    return await getRupturantsStats((period as StatsPeriod) || "30days", undefined, ml_id as string | undefined);
  }

  const targetRegion = region || (userRegions.length === 1 ? userRegions[0] : undefined);

  return await getRupturantsStats(
    (period as StatsPeriod) || "30days",
    targetRegion as string | undefined,
    ml_id as string | undefined
  );
};

const getDossiersTraitesRoute = async (req, { locals }) => {
  const { period, region, ml_id, national } = req.query;
  const userRegions = locals.regions as string[];

  if (region && userRegions.length > 0 && !userRegions.includes(region as string)) {
    throw Boom.forbidden("Accès non autorisé à cette région");
  }

  if (ml_id) {
    await verifyMlInRegions(ml_id as string, userRegions);
  }

  if (national) {
    return await getDossiersTraitesStats((period as StatsPeriod) || "30days", undefined, ml_id as string | undefined);
  }

  const targetRegion = region || (userRegions.length === 1 ? userRegions[0] : undefined);

  return await getDossiersTraitesStats(
    (period as StatsPeriod) || "30days",
    targetRegion as string | undefined,
    ml_id as string | undefined
  );
};

const getTraitementMLRoute = async (req, { locals }) => {
  const { period, region, page, limit, sort_by, sort_order, search } = req.query;
  const userRegions = locals.regions as string[];

  if (region && userRegions.length > 0 && !userRegions.includes(region as string)) {
    throw Boom.forbidden("Accès non autorisé à cette région");
  }

  const targetRegion = region || (userRegions.length === 1 ? userRegions[0] : undefined);

  return await getTraitementStatsByMissionLocale({
    period: (period as StatsPeriod) || "30days",
    region: targetRegion as string | undefined,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort_by: (sort_by as string) || "total_jeunes",
    sort_order: (sort_order as "asc" | "desc") || "desc",
    search: search as string | undefined,
  });
};

const getTraitementRegionsRoute = async (req, { locals }) => {
  const { national } = req.query;
  const userRegions = locals.regions as string[];

  const allRegions = await getSuiviTraitementByRegion();

  if (national) {
    return allRegions;
  }

  if (userRegions.length > 0) {
    return allRegions.filter((r) => userRegions.includes(r.code));
  }

  return allRegions;
};

const getCouvertureRegionsRoute = async (req, { locals }) => {
  const { period, national } = req.query;
  const userRegions = locals.regions as string[];

  const stats = await getCouvertureRegionsStats((period as StatsPeriod) || "30days");

  if (national) {
    return stats;
  }

  if (userRegions.length > 0) {
    stats.regions = stats.regions.filter((r) => userRegions.includes(r.code));
  }

  return stats;
};

const getAccompagnementConjointRoute = async (req, { locals }) => {
  const { region, national } = req.query;
  const userRegions = locals.regions as string[];

  if (region && userRegions.length > 0 && !userRegions.includes(region as string)) {
    throw Boom.forbidden("Accès non autorisé à cette région");
  }

  if (national) {
    return await getAccompagnementConjointStats(undefined);
  }

  const targetRegion = region || (userRegions.length === 1 ? userRegions[0] : undefined);

  return await getAccompagnementConjointStats(targetRegion as string | undefined);
};

const getMlDetailRoute = async (req, { locals }) => {
  const { id } = req.params;
  const userRegions = locals.regions as string[];

  await verifyMlInRegions(id, userRegions);

  return getMissionLocaleDetail(new ObjectId(id));
};

const getMlMembresRoute = async (req, { locals }) => {
  const { id } = req.params;
  const userRegions = locals.regions as string[];

  await verifyMlInRegions(id, userRegions);

  return getMissionLocaleMembers(new ObjectId(id));
};

async function verifyMlInRegions(mlId: string, userRegions: string[]): Promise<void> {
  if (userRegions.length === 0) return;

  const ml = await organisationsDb().findOne({
    _id: new ObjectId(mlId),
    type: "MISSION_LOCALE",
  });

  if (!ml) {
    throw Boom.notFound(`Mission Locale non trouvée: ${mlId}`);
  }

  const mlRegion = (ml as { adresse?: { region?: string } }).adresse?.region;

  if (mlRegion && !userRegions.includes(mlRegion)) {
    throw Boom.forbidden("Accès non autorisé à cette Mission Locale");
  }
}

export { getRegionsFromOrganisation };
