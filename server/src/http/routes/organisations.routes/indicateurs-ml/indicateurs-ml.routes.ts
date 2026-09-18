import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { zStatsPeriod, zStatsSegment, zTraitementMlSortBy } from "shared/models/data/nationalStats.model";
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
  getCollaborationSegmentStats,
  getTraitementStats,
  getDeploymentStats,
  getSyntheseRegionsStats,
  getCouvertureRegionsStats,
  getTraitementExportData,
  getWhatsAppStats,
  getPrequalifStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { organisationsDb } from "@/common/model/collections";
import {
  DefaultParams,
  DefaultQuery,
  IndicateursMlLocals,
  returnResult,
  RouteHandler,
} from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export type { OrganisationWithRegions };

const mlIdSchema = z.string().regex(/^[0-9a-f]{24}$/);
const periodQuery = z.object({ period: zStatsPeriod.optional() });
const traitementQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  segment: zStatsSegment.default("rupture"),
});
const statsQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: z.coerce.boolean().optional(),
  segment: zStatsSegment.default("rupture"),
});
const collaborationsQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: z.coerce.boolean().optional(),
});
const traitementMlQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  segment: zStatsSegment.default("rupture"),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  sort_by: zTraitementMlSortBy.default("total_jeunes"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
});
const nationalQuery = z.object({ period: zStatsPeriod.optional(), national: z.coerce.boolean().optional() });
const traitementRegionsQuery = nationalQuery.extend({ segment: zStatsSegment.default("all") });
const exportQuery = z.object({ region: z.string().optional(), ml_id: mlIdSchema.optional() });
const accompagnementQuery = z.object({
  region: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: z.coerce.boolean().optional(),
});
const mlIdParams = z.object({ id: mlIdSchema });

type IndicateursHandler<TQuery = DefaultQuery, TParams = DefaultParams> = RouteHandler<
  IndicateursMlLocals,
  TParams,
  TQuery
>;

export default () => {
  const router = express.Router();

  router.get(
    "/synthese/deployment",
    validateRequestMiddleware({ query: periodQuery }),
    returnResult(getDeploymentRoute)
  );
  router.get(
    "/synthese/regions",
    validateRequestMiddleware({ query: periodQuery }),
    returnResult(getSyntheseRegionsRoute)
  );
  router.get("/traitement", validateRequestMiddleware({ query: traitementQuery }), returnResult(getTraitementRoute));
  router.get("/stats/rupturants", validateRequestMiddleware({ query: statsQuery }), returnResult(getRupturantsRoute));
  router.get(
    "/stats/dossiers-traites",
    validateRequestMiddleware({ query: statsQuery }),
    returnResult(getDossiersTraitesRoute)
  );
  router.get(
    "/stats/traitement/ml",
    validateRequestMiddleware({ query: traitementMlQuery }),
    returnResult(getTraitementMLRoute)
  );
  router.get(
    "/stats/traitement/regions",
    validateRequestMiddleware({ query: traitementRegionsQuery }),
    returnResult(getTraitementRegionsRoute)
  );
  router.get(
    "/stats/traitement/export",
    validateRequestMiddleware({ query: exportQuery }),
    returnResult(getTraitementExportRoute)
  );
  router.get(
    "/stats/collaborations",
    validateRequestMiddleware({ query: collaborationsQuery }),
    returnResult(getCollaborationsRoute)
  );
  router.get(
    "/stats/couverture-regions",
    validateRequestMiddleware({ query: nationalQuery }),
    returnResult(getCouvertureRegionsRoute)
  );
  router.get("/stats/whatsapp", validateRequestMiddleware({ query: periodQuery }), returnResult(getWhatsAppRoute));
  router.get("/stats/prequalif", validateRequestMiddleware({ query: periodQuery }), returnResult(getPrequalifRoute));
  router.get(
    "/stats/accompagnement-conjoint",
    validateRequestMiddleware({ query: accompagnementQuery }),
    returnResult(getAccompagnementConjointRoute)
  );
  router.get(
    "/mission-locale/:id/detail",
    validateRequestMiddleware({ params: mlIdParams }),
    returnResult(getMlDetailRoute)
  );
  router.get(
    "/mission-locale/:id/membres",
    validateRequestMiddleware({ params: mlIdParams }),
    returnResult(getMlMembresRoute)
  );

  return router;
};

const getDeploymentRoute: IndicateursHandler<z.infer<typeof periodQuery>> = async (req, { locals }) => {
  const { period } = req.query;
  const regions = locals.regions;

  const stats = await getDeploymentStats(period || "30days");

  if (regions.length > 0) {
    stats.regionsActives = stats.regionsActives.filter((code) => regions.includes(code));
  }

  return stats;
};

const getSyntheseRegionsRoute: IndicateursHandler<z.infer<typeof periodQuery>> = async (req, { locals }) => {
  const { period } = req.query;
  const regions = locals.regions;

  const stats = await getSyntheseRegionsStats(period || "30days");

  if (regions.length > 0) {
    stats.regions = stats.regions.filter((r) => regions.includes(r.code));
  }

  return stats;
};

const assertRegionAllowed = (region: string | undefined, userRegions: string[]) => {
  if (region && userRegions.length > 0 && !userRegions.includes(region)) {
    throw Boom.forbidden("Accès non autorisé à cette région");
  }
};

/**
 * Périmètre des lecteurs de stats : `ml_id` (vérifié) court-circuite tout, `national` ignore le
 * périmètre territorial, sinon la région demandée ou toutes les régions de l'utilisateur.
 * Un admin (aucune région) sans paramètre voit tout.
 */
const resolveStatsScope = async (
  query: { region?: string; ml_id?: string; national?: boolean },
  userRegions: string[]
): Promise<{ regions?: string[]; mlId?: string }> => {
  const { region, ml_id, national } = query;

  assertRegionAllowed(region, userRegions);

  if (ml_id) {
    await verifyMlInRegions(ml_id, userRegions);
    return { mlId: ml_id };
  }

  if (national) {
    return {};
  }

  if (region) {
    return { regions: [region] };
  }

  return userRegions.length > 0 ? { regions: userRegions } : {};
};

const getTraitementRoute: IndicateursHandler<z.infer<typeof traitementQuery>> = async (req, { locals }) => {
  const { period, segment } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getTraitementStats(period || "30days", undefined, scope.regions, segment);
};

const getRupturantsRoute: IndicateursHandler<z.infer<typeof statsQuery>> = async (req, { locals }) => {
  const { period, segment } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getRupturantsStats(period || "30days", scope.regions, scope.mlId, segment);
};

const getDossiersTraitesRoute: IndicateursHandler<z.infer<typeof statsQuery>> = async (req, { locals }) => {
  const { period, segment } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getDossiersTraitesStats(period || "30days", scope.regions, scope.mlId, segment);
};

const getCollaborationsRoute: IndicateursHandler<z.infer<typeof collaborationsQuery>> = async (req, { locals }) => {
  const { period } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getCollaborationSegmentStats(period || "30days", scope.regions, scope.mlId);
};

const getTraitementMLRoute: IndicateursHandler<z.infer<typeof traitementMlQuery>> = async (req, { locals }) => {
  const { period, region, segment, page, limit, sort_by, sort_order, search } = req.query;
  const userRegions = locals.regions;

  assertRegionAllowed(region, userRegions);

  return await getTraitementStatsByMissionLocale({
    period: period || "30days",
    segment,
    region,
    regions: !region && userRegions.length > 0 ? userRegions : undefined,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort_by,
    sort_order: sort_order || "desc",
    search,
  });
};

const getTraitementRegionsRoute: IndicateursHandler<z.infer<typeof traitementRegionsQuery>> = async (
  req,
  { locals }
) => {
  const { national, segment } = req.query;
  const userRegions = locals.regions;

  const allRegions = await getSuiviTraitementByRegion(segment);

  if (national) {
    return allRegions;
  }

  if (userRegions.length > 0) {
    return allRegions.filter((r) => userRegions.includes(r.code));
  }

  return allRegions;
};

const getTraitementExportRoute: IndicateursHandler<z.infer<typeof exportQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getTraitementExportData(scope);
};

const getCouvertureRegionsRoute: IndicateursHandler<z.infer<typeof nationalQuery>> = async (req, { locals }) => {
  const { period, national } = req.query;
  const userRegions = locals.regions;

  const stats = await getCouvertureRegionsStats(period || "30days");

  if (national) {
    return stats;
  }

  if (userRegions.length > 0) {
    stats.regions = stats.regions.filter((r) => userRegions.includes(r.code));
  }

  return stats;
};

const getAccompagnementConjointRoute: IndicateursHandler<z.infer<typeof accompagnementQuery>> = async (
  req,
  { locals }
) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getAccompagnementConjointStats(scope.regions, scope.mlId);
};

const getMlDetailRoute: IndicateursHandler<DefaultQuery, z.infer<typeof mlIdParams>> = async (req, { locals }) => {
  const { id } = req.params;
  const userRegions = locals.regions;

  await verifyMlInRegions(id, userRegions);

  return getMissionLocaleDetail(new ObjectId(id));
};

const getMlMembresRoute: IndicateursHandler<DefaultQuery, z.infer<typeof mlIdParams>> = async (req, { locals }) => {
  const { id } = req.params;
  const userRegions = locals.regions;

  await verifyMlInRegions(id, userRegions);

  return getMissionLocaleMembers(new ObjectId(id));
};

const getWhatsAppRoute: IndicateursHandler<z.infer<typeof periodQuery>> = async (req, { locals }) => {
  const { period } = req.query;

  if (locals.organisation.type !== "ADMINISTRATEUR") {
    throw Boom.forbidden("Accès réservé aux administrateurs");
  }

  return await getWhatsAppStats(period || "all");
};

/**
 * GET /api/v1/organisation/indicateurs-ml/stats/prequalif
 * Admin-only
 *
 */
const getPrequalifRoute: IndicateursHandler<z.infer<typeof periodQuery>> = async (req, { locals }) => {
  if (locals.organisation.type !== "ADMINISTRATEUR") {
    throw Boom.forbidden("Accès réservé aux administrateurs");
  }

  const { period } = req.query;

  return await getPrequalifStats(period || "all");
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
