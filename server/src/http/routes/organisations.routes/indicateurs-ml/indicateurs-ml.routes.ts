import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { ORGANISATION_TYPE } from "shared/constants";
import { COLLABORATION_CUTOFF_DATE } from "shared/constants/collaboration";
import { DEPARTEMENTS_BY_CODE } from "shared/constants/territoires";
import {
  COLLAB_DOSSIER_DELAIS,
  COLLAB_DOSSIER_RESULTATS,
  COLLAB_DOSSIER_STATUTS,
  zCfaEtablissementsSortBy,
  zCfaInjoignablesSortBy,
  zStatsPeriod,
  zStatsSegment,
  zTraitementMlSortBy,
} from "shared/models/data/nationalStats.model";
import { zBooleanStringSchema } from "shared/models/parts/zodPrimitives";
import { zCfaInvitesSansCollabQuery } from "shared/models/routes/admin/cfa-invites-sans-collab.api";
import { getRegionsFromOrganisation, OrganisationWithRegions } from "shared/utils/organisationRegions";
import { z } from "zod";

import {
  getCfaInvitesSansCollab,
  listCfaInvitesSansCollab,
} from "@/common/actions/admin/collaborations/cfa-invites-sans-collab.actions";
import {
  getMissionLocaleDetail,
  getMissionLocaleMembers,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getCfaNpsStats, listCfaInjoignables } from "@/common/actions/cfa/cfa-collaboration-stats.actions";
import { getCfaAdoptionStats, listCfaEtablissements } from "@/common/actions/cfa/cfa-stats.actions";
import { listCollaborationDossiers } from "@/common/actions/mission-locale/collaboration-dossiers.actions";
import { getMissionLocaleFicheIndicateurs } from "@/common/actions/mission-locale/mission-locale-fiche.actions";
import {
  getRupturantsStats,
  getDossiersTraitesStats,
  getTraitementStatsByMissionLocale,
  getSuiviTraitementByRegion,
  getCollaborationMensuelStats,
  getCollaborationSegmentStats,
  getTraitementStats,
  getDeploymentStats,
  getSyntheseRegionsStats,
  getCouvertureRegionsStats,
  getDepartementalStats,
  getTraitementExportData,
  getWhatsAppStats,
  getPrequalifStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { rechercherEtablissements } from "@/common/actions/recherche/recherche-etablissements.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
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
const syntheseQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  national: zBooleanStringSchema.optional(),
});
const traitementQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
  segment: zStatsSegment.default("rupture"),
});
const statsQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
  segment: zStatsSegment.default("rupture"),
});
const collaborationsQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
});
const zCsvList = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").filter(Boolean) : undefined));
const traitementMlQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  segment: zStatsSegment.default("rupture"),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  sort_by: zTraitementMlSortBy.default("total_jeunes"),
  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
  departements: zCsvList,
  utilise_service: zBooleanStringSchema.optional(),
  engagee: zBooleanStringSchema.optional(),
});
const cfaEtablissementsExportQuery = z.object({
  region: z.string().optional(),
  departements: zCsvList,
  search: z.string().optional(),
  natures: zCsvList,
  utilisateur: zBooleanStringSchema.optional(),
  qualiopi: zBooleanStringSchema.optional(),
  collab_active: zBooleanStringSchema.optional(),
  sort_by: zCfaEtablissementsSortBy.default("collaborations"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
const cfaEtablissementsQuery = cfaEtablissementsExportQuery.extend({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});
const cfaInvitesQuery = zCfaInvitesSansCollabQuery.extend({ region: z.string().optional() });
const cfaInvitesExportQuery = cfaInvitesQuery.omit({ page: true, limit: true });
const cfaInjoignablesExportQuery = z.object({
  region: z.string().optional(),
  sort_by: zCfaInjoignablesSortBy.default("taux"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
const cfaInjoignablesQuery = cfaInjoignablesExportQuery.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
const zCsvEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  zCsvList.pipe(z.array(z.enum(values)).optional());
const zCsvObjectIds = zCsvList.pipe(z.array(z.string().regex(/^[0-9a-f]{24}$/)).optional());
const collaborationDossiersExportQuery = z.object({
  region: z.string().optional(),
  departements: zCsvList,
  search: z.string().optional(),
  date_debut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  statuts: zCsvEnum(COLLAB_DOSSIER_STATUTS),
  delais: zCsvEnum(COLLAB_DOSSIER_DELAIS),
  resultats: zCsvEnum(COLLAB_DOSSIER_RESULTATS),
  situations: zCsvList,
  motifs: zCsvList,
  cfa_ids: zCsvObjectIds,
  ml_ids: zCsvObjectIds,
});
const collaborationDossiersQuery = collaborationDossiersExportQuery.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
const rechercheQuery = z.object({
  q: z.string().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
const couvertureDepartementsQuery = z.object({ period: zStatsPeriod.optional(), region: z.string() });
const nationalQuery = z.object({ period: zStatsPeriod.optional(), national: zBooleanStringSchema.optional() });
const traitementRegionsQuery = nationalQuery.extend({ segment: zStatsSegment.default("all") });
const exportQuery = z.object({
  region: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
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
    validateRequestMiddleware({ query: syntheseQuery }),
    returnResult(getDeploymentRoute)
  );
  router.get(
    "/synthese/regions",
    validateRequestMiddleware({ query: syntheseQuery }),
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
    "/stats/collaborations/mensuel",
    validateRequestMiddleware({ query: collaborationsQuery }),
    returnResult(getCollaborationsMensuelRoute)
  );
  router.get(
    "/stats/collaborations/dossiers",
    validateRequestMiddleware({ query: collaborationDossiersQuery }),
    returnResult(getCollaborationDossiersRoute)
  );
  router.get(
    "/stats/collaborations/dossiers/export",
    validateRequestMiddleware({ query: collaborationDossiersExportQuery }),
    returnResult(getCollaborationDossiersExportRoute)
  );
  router.get("/stats/recherche", validateRequestMiddleware({ query: rechercheQuery }), returnResult(getRechercheRoute));
  router.get(
    "/stats/couverture-regions",
    validateRequestMiddleware({ query: nationalQuery }),
    returnResult(getCouvertureRegionsRoute)
  );
  router.get(
    "/stats/cfa/adoption",
    validateRequestMiddleware({ query: syntheseQuery }),
    returnResult(getCfaAdoptionRoute)
  );
  router.get(
    "/stats/cfa/etablissements",
    validateRequestMiddleware({ query: cfaEtablissementsQuery }),
    returnResult(getCfaEtablissementsRoute)
  );
  router.get(
    "/stats/cfa/etablissements/export",
    validateRequestMiddleware({ query: cfaEtablissementsExportQuery }),
    returnResult(getCfaEtablissementsExportRoute)
  );
  router.get(
    "/stats/cfa/invites-sans-collab",
    validateRequestMiddleware({ query: cfaInvitesQuery }),
    returnResult(getCfaInvitesRoute)
  );
  router.get(
    "/stats/cfa/invites-sans-collab/export",
    validateRequestMiddleware({ query: cfaInvitesExportQuery }),
    returnResult(getCfaInvitesExportRoute)
  );
  router.get("/stats/cfa/nps", validateRequestMiddleware({ query: syntheseQuery }), returnResult(getCfaNpsRoute));
  router.get(
    "/stats/cfa/injoignables",
    validateRequestMiddleware({ query: cfaInjoignablesQuery }),
    returnResult(getCfaInjoignablesRoute)
  );
  router.get(
    "/stats/cfa/injoignables/export",
    validateRequestMiddleware({ query: cfaInjoignablesExportQuery }),
    returnResult(getCfaInjoignablesExportRoute)
  );
  router.get(
    "/stats/couverture-departements",
    validateRequestMiddleware({ query: couvertureDepartementsQuery }),
    returnResult(getCouvertureDepartementsRoute)
  );

  router.get("/stats/whatsapp", validateRequestMiddleware({ query: periodQuery }), returnResult(getWhatsAppRoute));
  router.get("/stats/prequalif", validateRequestMiddleware({ query: periodQuery }), returnResult(getPrequalifRoute));
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

const getDeploymentRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getDeploymentStats(req.query.period || "30days", scope.regions);
};

const getSyntheseRegionsRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getSyntheseRegionsStats(req.query.period || "30days", scope.regions);
};

const assertRegionAllowed = (region: string | undefined, userRegions: string[]) => {
  if (region && userRegions.length > 0 && !userRegions.includes(region)) {
    throw Boom.forbidden("Accès non autorisé à cette région");
  }
};

const assertDepartementsAllowed = (departements: string[] | undefined, userRegions: string[]) => {
  departements?.forEach((code) => {
    const departementRegion = DEPARTEMENTS_BY_CODE[code as keyof typeof DEPARTEMENTS_BY_CODE]?.region.code;
    if (!departementRegion || (userRegions.length > 0 && !userRegions.includes(departementRegion))) {
      throw Boom.forbidden("Accès non autorisé à ce département");
    }
  });
};

const scopedRegions = (region: string | undefined, userRegions: string[]) =>
  region ? [region] : userRegions.length > 0 ? userRegions : undefined;

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

  return await getTraitementStats(period || "30days", undefined, scope.regions, segment, scope.mlId);
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

const getCollaborationsMensuelRoute: IndicateursHandler<z.infer<typeof collaborationsQuery>> = async (
  req,
  { locals }
) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getCollaborationMensuelStats(req.query.period || "30days", scope.regions, scope.mlId);
};

/**
 * Liste nominative : l'ARML n'y a pas accès, la DDETS est limitée à son département, la DREETS à sa région.
 */
const resolveCollaborationDossiersScope = (
  query: z.infer<typeof collaborationDossiersExportQuery>,
  { organisation, regions: userRegions }: IndicateursMlLocals
) => {
  if (organisation.type === ORGANISATION_TYPE.ARML) {
    throw Boom.forbidden("Accès non autorisé à la liste des collaborations");
  }
  assertRegionAllowed(query.region, userRegions);
  assertDepartementsAllowed(query.departements, userRegions);

  if (organisation.type === ORGANISATION_TYPE.DDETS) {
    const departement = (organisation as { code_departement?: string }).code_departement;
    if (!departement || query.departements?.some((code) => code !== departement)) {
      throw Boom.forbidden("Accès non autorisé à ce département");
    }
    return { regions: userRegions, departements: [departement] };
  }

  return { regions: scopedRegions(query.region, userRegions), departements: query.departements };
};

const toCollaborationDossiersFilters = (query: z.infer<typeof collaborationDossiersExportQuery>) => ({
  search: query.search,
  dateDebut: query.date_debut,
  dateFin: query.date_fin,
  statuts: query.statuts,
  delais: query.delais,
  resultats: query.resultats,
  situations: query.situations,
  motifs: query.motifs,
  cfaIds: query.cfa_ids?.map((id) => new ObjectId(id)),
  mlIds: query.ml_ids?.map((id) => new ObjectId(id)),
});

const getCollaborationDossiersRoute: IndicateursHandler<z.infer<typeof collaborationDossiersQuery>> = async (
  req,
  { locals }
) => {
  const { page, limit } = req.query;
  return await listCollaborationDossiers(
    resolveCollaborationDossiersScope(req.query, locals),
    toCollaborationDossiersFilters(req.query),
    { page, limit }
  );
};

const getCollaborationDossiersExportRoute: IndicateursHandler<
  z.infer<typeof collaborationDossiersExportQuery>
> = async (req, { locals }) => {
  const result = await listCollaborationDossiers(
    resolveCollaborationDossiersScope(req.query, locals),
    toCollaborationDossiersFilters(req.query)
  );
  await createTelechargementListeNomLog(
    "indicateurs_collaborations",
    result.data.map((dossier) => dossier.id),
    new Date(),
    req.user._id,
    undefined,
    locals.organisation._id
  );
  return { data: result.data };
};

const getRechercheRoute: IndicateursHandler<z.infer<typeof rechercheQuery>> = async (req, { locals }) => {
  const { q, page, limit } = req.query;
  return await rechercherEtablissements(q, scopedRegions(undefined, locals.regions), { page, limit });
};

const getTraitementMLRoute: IndicateursHandler<z.infer<typeof traitementMlQuery>> = async (req, { locals }) => {
  const { period, region, segment, page, limit, sort_by, sort_order, search, departements, utilise_service, engagee } =
    req.query;
  const userRegions = locals.regions;

  assertRegionAllowed(region, userRegions);
  assertDepartementsAllowed(departements, userRegions);

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
    departements,
    utiliseService: utilise_service,
    engagee,
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

const getCfaAdoptionRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getCfaAdoptionStats(req.query.period || "30days", scope.regions);
};

const findCfaEtablissements = (query: z.infer<typeof cfaEtablissementsExportQuery>, userRegions: string[]) => {
  const { region, departements, search, natures, utilisateur, qualiopi, collab_active, sort_by, sort_order } = query;

  assertRegionAllowed(region, userRegions);
  assertDepartementsAllowed(departements, userRegions);

  return listCfaEtablissements({
    regions: scopedRegions(region, userRegions),
    departements,
    search,
    natures,
    utilisateur,
    qualiopi,
    collabActive: collab_active,
    sortBy: sort_by,
    sortOrder: sort_order,
  });
};

const getCfaEtablissementsRoute: IndicateursHandler<z.infer<typeof cfaEtablissementsQuery>> = async (
  req,
  { locals }
) => {
  const { page, limit } = req.query;
  const rows = await findCfaEtablissements(req.query, locals.regions);

  return {
    data: rows.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) },
  };
};

const getCfaEtablissementsExportRoute: IndicateursHandler<z.infer<typeof cfaEtablissementsExportQuery>> = async (
  req,
  { locals }
) => ({ data: await findCfaEtablissements(req.query, locals.regions) });

const cfaInvitesOptions = (region: string | undefined, userRegions: string[]) => {
  assertRegionAllowed(region, userRegions);
  return {
    territoire: { regions: scopedRegions(region, userRegions) },
    collaborationsDepuis: COLLABORATION_CUTOFF_DATE,
  };
};

const getCfaInvitesRoute: IndicateursHandler<z.infer<typeof cfaInvitesQuery>> = async (req, { locals }) =>
  getCfaInvitesSansCollab(req.query, cfaInvitesOptions(req.query.region, locals.regions));

const getCfaInvitesExportRoute: IndicateursHandler<z.infer<typeof cfaInvitesExportQuery>> = async (
  req,
  { locals }
) => ({ data: await listCfaInvitesSansCollab(req.query, cfaInvitesOptions(req.query.region, locals.regions)) });

const getCfaNpsRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getCfaNpsStats({ regions: scope.regions });
};

const findCfaInjoignables = (query: z.infer<typeof cfaInjoignablesExportQuery>, userRegions: string[]) => {
  assertRegionAllowed(query.region, userRegions);
  return listCfaInjoignables({ regions: scopedRegions(query.region, userRegions) }, query);
};

const getCfaInjoignablesRoute: IndicateursHandler<z.infer<typeof cfaInjoignablesQuery>> = async (req, { locals }) => {
  const { page, limit } = req.query;
  const rows = await findCfaInjoignables(req.query, locals.regions);

  return {
    total: rows.length,
    pagination: { page, limit, total_pages: Math.ceil(rows.length / limit) },
    data: rows.slice((page - 1) * limit, page * limit),
  };
};

const getCfaInjoignablesExportRoute: IndicateursHandler<z.infer<typeof cfaInjoignablesExportQuery>> = async (
  req,
  { locals }
) => ({ data: await findCfaInjoignables(req.query, locals.regions) });

const getCouvertureDepartementsRoute: IndicateursHandler<z.infer<typeof couvertureDepartementsQuery>> = async (
  req,
  { locals }
) => {
  assertRegionAllowed(req.query.region, locals.regions);

  return await getDepartementalStats(req.query.period || "30days", req.query.region);
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

const getMlDetailRoute: IndicateursHandler<DefaultQuery, z.infer<typeof mlIdParams>> = async (req, { locals }) => {
  const { id } = req.params;
  const userRegions = locals.regions;

  await verifyMlInRegions(id, userRegions);

  const mlId = new ObjectId(id);
  const [detail, indicateurs] = await Promise.all([
    getMissionLocaleDetail(mlId),
    getMissionLocaleFicheIndicateurs(mlId),
  ]);
  return { ...detail, indicateurs };
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

  if (!mlRegion || !userRegions.includes(mlRegion)) {
    throw Boom.forbidden("Accès non autorisé à cette Mission Locale");
  }
}

export { getRegionsFromOrganisation };
