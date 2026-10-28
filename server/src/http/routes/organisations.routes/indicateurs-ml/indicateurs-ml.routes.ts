import * as Boom from "@hapi/boom";
import { ObjectId } from "bson";
import express from "express";
import { ORGANISATION_TYPE } from "shared/constants";
import { DEPARTEMENTS_BY_CODE } from "shared/constants/territoires";
import {
  CFA_COLLAB_ML_SORT_BY,
  COLLAB_CFA_ORIGINE_SORT_BY,
  COLLAB_DOSSIER_DELAIS,
  COLLAB_DOSSIER_RESULTATS,
  COLLAB_DOSSIER_STATUTS,
  type ICollaborationDossier,
  ML_ALERTE_LISTE_SORT_BY,
  ML_ALERTE_LISTE_TYPES,
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
import {
  getCfaCollaborationStats,
  getTerritoireCollaborationStats,
  listCfaCollaborationsParMl,
} from "@/common/actions/cfa/cfa-collaborations.actions";
import { getCfaFiche, getCfaMembres } from "@/common/actions/cfa/cfa-fiche.actions";
import { getCfaAdoptionStats, listCfaEtablissements } from "@/common/actions/cfa/cfa-stats.actions";
import { listCollaborationsCfaOrigine } from "@/common/actions/mission-locale/collaboration-cfa-origine.actions";
import { getCollaborationCorrelations } from "@/common/actions/mission-locale/collaboration-correlations.actions";
import { listCollaborationDossiers } from "@/common/actions/mission-locale/collaboration-dossiers.actions";
import { listMlAlertes } from "@/common/actions/mission-locale/mission-locale-alertes.actions";
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
import type { Territoire } from "@/common/actions/mission-locale/mission-locale-stats.helpers";
import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import { rechercherEtablissements } from "@/common/actions/recherche/recherche-etablissements.actions";
import { createSession } from "@/common/actions/sessions.actions";
import { createTelechargementListeNomLog } from "@/common/actions/telechargementListeNomLogs.actions";
import logger from "@/common/logger";
import { organisationsDb, organismesDb } from "@/common/model/collections";
import type { AuthContext } from "@/common/model/internal/AuthContext";
import { responseWithCookie } from "@/common/utils/httpUtils";
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
  departement: z.string().optional(),
  national: zBooleanStringSchema.optional(),
});
const traitementQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  departement: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
  segment: zStatsSegment.default("rupture"),
});
const statsQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  departement: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
  segment: zStatsSegment.default("rupture"),
});
const collaborationsQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  departement: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
});
const collabCfaOrigineQuery = z.object({
  ml_id: mlIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort_by: z.enum(COLLAB_CFA_ORIGINE_SORT_BY).default("collaborations"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
const zCsvList = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").filter(Boolean) : undefined));
const traitementMlQuery = z.object({
  period: zStatsPeriod.optional(),
  region: z.string().optional(),
  departement: z.string().optional(),
  national: zBooleanStringSchema.optional(),
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
  departement: z.string().optional(),
  national: zBooleanStringSchema.optional(),
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
const cfaInvitesQuery = zCfaInvitesSansCollabQuery.extend({
  region: z.string().optional(),
  departement: z.string().optional(),
  national: zBooleanStringSchema.optional(),
});
const cfaInvitesExportQuery = cfaInvitesQuery.omit({ page: true, limit: true });
const cfaInjoignablesExportQuery = z.object({
  region: z.string().optional(),
  departement: z.string().optional(),
  national: zBooleanStringSchema.optional(),
  sort_by: zCfaInjoignablesSortBy.default("taux"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
const cfaInjoignablesQuery = cfaInjoignablesExportQuery.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
const mlAlertesParams = z.object({ type: z.enum(ML_ALERTE_LISTE_TYPES) });
const mlAlertesExportQuery = z.object({
  region: z.string().optional(),
  departement: z.string().optional(),
  national: zBooleanStringSchema.optional(),
  sort_by: z.enum(ML_ALERTE_LISTE_SORT_BY).default("total_jeunes"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
const mlAlertesQuery = mlAlertesExportQuery.extend({
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
  ml_id: mlIdSchema.optional(),
  cfa_id: mlIdSchema.optional(),
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
const nationalQuery = z.object({
  period: zStatsPeriod.optional(),
  departement: z.string().optional(),
  national: zBooleanStringSchema.optional(),
});
const traitementRegionsQuery = nationalQuery.extend({ segment: zStatsSegment.default("all") });
const exportQuery = z.object({
  region: z.string().optional(),
  departement: z.string().optional(),
  ml_id: mlIdSchema.optional(),
  national: zBooleanStringSchema.optional(),
});
const impersonateBody = z
  .object({ cfa_id: mlIdSchema.optional(), ml_id: mlIdSchema.optional() })
  .refine((body) => Boolean(body.cfa_id) !== Boolean(body.ml_id), "Indiquer un CFA ou une Mission Locale");
const mlIdParams = z.object({ id: mlIdSchema });
const organismeIdParams = z.object({ id: mlIdSchema });
const cfaCollabMlQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort_by: z.enum(CFA_COLLAB_ML_SORT_BY).default("envoyees"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

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
    "/stats/collaborations/correlations",
    validateRequestMiddleware({ query: collaborationsQuery }),
    returnResult(getCollaborationCorrelationsRoute)
  );
  router.get(
    "/stats/collaborations/mensuel",
    validateRequestMiddleware({ query: collaborationsQuery }),
    returnResult(getCollaborationsMensuelRoute)
  );
  router.get(
    "/stats/collaborations/cfa-origine",
    validateRequestMiddleware({ query: collabCfaOrigineQuery }),
    returnResult(getCollabCfaOrigineRoute)
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
    "/stats/ml/alertes/:type",
    validateRequestMiddleware({ params: mlAlertesParams, query: mlAlertesQuery }),
    returnResult(getMlAlertesRoute)
  );
  router.get(
    "/stats/ml/alertes/:type/export",
    validateRequestMiddleware({ params: mlAlertesParams, query: mlAlertesExportQuery }),
    returnResult(getMlAlertesExportRoute)
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
  router.get(
    "/cfa/:id/detail",
    validateRequestMiddleware({ params: organismeIdParams }),
    returnResult(getCfaDetailRoute)
  );
  router.get(
    "/cfa/:id/collaborations",
    validateRequestMiddleware({ params: organismeIdParams }),
    returnResult(getCfaCollaborationsRoute)
  );
  router.get(
    "/cfa/:id/collaborations/ml",
    validateRequestMiddleware({ params: organismeIdParams, query: cfaCollabMlQuery }),
    returnResult(getCfaCollaborationsMlRoute)
  );
  router.get(
    "/cfa/:id/membres",
    validateRequestMiddleware({ params: organismeIdParams }),
    returnResult(getCfaMembresRoute)
  );
  router.post("/impersonate", validateRequestMiddleware({ body: impersonateBody }), returnResult(impersonateRoute));

  return router;
};

const getDeploymentRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getDeploymentStats(req.query.period || "30days", scope.territoire);
};

const getSyntheseRegionsRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getSyntheseRegionsStats(req.query.period || "30days", scope.territoire.regions);
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

const assertDepartementsConnus = (departements: string[] | undefined) => {
  if (departements?.some((code) => !DEPARTEMENTS_BY_CODE[code as keyof typeof DEPARTEMENTS_BY_CODE])) {
    throw Boom.badRequest("Département inconnu");
  }
};

const scopedRegions = (region: string | undefined, userRegions: string[]) =>
  region ? [region] : userRegions.length > 0 ? userRegions : undefined;

type TerritoireQuery = { region?: string; departement?: string; national?: boolean };

/**
 * Chiffres agrégés et listes de structures, ouverts à tous les territoires : le département demandé (dans sa
 * région), sinon la région demandée, la France entière avec `national`, ou par défaut les régions de l'utilisateur.
 */
const resolveTerritoire = (query: TerritoireQuery, userRegions: string[]): Territoire => {
  if (query.departement) {
    const region = DEPARTEMENTS_BY_CODE[query.departement as keyof typeof DEPARTEMENTS_BY_CODE]?.region.code;
    if (!region) {
      throw Boom.badRequest("Département inconnu");
    }
    if (query.region && query.region !== region) {
      throw Boom.badRequest("Département hors de la région demandée");
    }
    return { regions: [region], departements: [query.departement] };
  }
  return {
    regions: query.region ? [query.region] : query.national ? undefined : scopedRegions(undefined, userRegions),
  };
};

/** Périmètre des stats : `ml_id` court-circuite le territoire. */
const resolveStatsScope = async (
  query: TerritoireQuery & { ml_id?: string },
  userRegions: string[]
): Promise<{ territoire: Territoire; mlId?: string }> => {
  if (query.ml_id) {
    await findMlOrThrow(query.ml_id);
    return { territoire: {}, mlId: query.ml_id };
  }
  return { territoire: resolveTerritoire(query, userRegions) };
};

const getTraitementRoute: IndicateursHandler<z.infer<typeof traitementQuery>> = async (req, { locals }) => {
  const { period, segment } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getTraitementStats(period || "30days", undefined, scope.territoire, segment, scope.mlId);
};

const getRupturantsRoute: IndicateursHandler<z.infer<typeof statsQuery>> = async (req, { locals }) => {
  const { period, segment } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getRupturantsStats(period || "30days", scope.territoire, scope.mlId, segment);
};

const getDossiersTraitesRoute: IndicateursHandler<z.infer<typeof statsQuery>> = async (req, { locals }) => {
  const { period, segment } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getDossiersTraitesStats(period || "30days", scope.territoire, scope.mlId, segment);
};

const getCollaborationsRoute: IndicateursHandler<z.infer<typeof collaborationsQuery>> = async (req, { locals }) => {
  const { period } = req.query;
  const scope = await resolveStatsScope(req.query, locals.regions);

  return scope.mlId
    ? await getCollaborationSegmentStats(period || "30days", {}, scope.mlId)
    : await getTerritoireCollaborationStats(period || "30days", scope.territoire);
};

const getCollaborationCorrelationsRoute: IndicateursHandler<z.infer<typeof collaborationsQuery>> = async (
  req,
  { locals }
) => {
  if (locals.organisation.type !== ORGANISATION_TYPE.ADMINISTRATEUR) {
    throw Boom.forbidden("Accès réservé aux administrateurs");
  }
  const scope = await resolveStatsScope(req.query, locals.regions);

  return getCollaborationCorrelations(scope.territoire, scope.mlId);
};

const getCollaborationsMensuelRoute: IndicateursHandler<z.infer<typeof collaborationsQuery>> = async (
  req,
  { locals }
) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getCollaborationMensuelStats(req.query.period || "30days", scope.territoire, scope.mlId);
};

const refusNominatif = (organisation: IndicateursMlLocals["organisation"], horsRegion: string) =>
  organisation.type === ORGANISATION_TYPE.DDETS ? "Accès non autorisé à ce département" : horsRegion;

/**
 * Liste nominative : l'ARML n'y a pas accès, la DDETS est limitée à son département, la DREETS à sa région.
 * Avec `ml_id` (fiche ML), le périmètre est celui de la ML : sa région, ou son département pour une DDETS.
 */
const resolveCollaborationDossiersScope = async (
  query: z.infer<typeof collaborationDossiersExportQuery>,
  { organisation, regions: userRegions }: IndicateursMlLocals
) => {
  const autorises: string[] = [ORGANISATION_TYPE.ADMINISTRATEUR, ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS];
  if (!autorises.includes(organisation.type)) {
    throw Boom.forbidden("Accès non autorisé à la liste des collaborations");
  }
  assertDepartementsConnus(query.departements);
  assertRegionAllowed(query.region, userRegions);
  assertDepartementsAllowed(query.departements, userRegions);

  if (query.cfa_id) {
    const { nominatif } = await verifyOrganismeInScope(query.cfa_id, { organisation, regions: userRegions });
    if (!nominatif) {
      throw Boom.forbidden(refusNominatif(organisation, "Accès non autorisé à cet organisme"));
    }
    return { organismeId: new ObjectId(query.cfa_id) };
  }

  if (query.ml_id) {
    const { nominatif } = await verifyMlInScope(query.ml_id, { organisation, regions: userRegions });
    if (!nominatif) {
      throw Boom.forbidden(refusNominatif(organisation, "Accès non autorisé à cette Mission Locale"));
    }
    return { missionLocaleId: new ObjectId(query.ml_id) };
  }

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
  const liste = await listCollaborationDossiers(
    await resolveCollaborationDossiersScope(req.query, locals),
    toCollaborationDossiersFilters(req.query),
    { page, limit }
  );
  return { ...liste, data: await withPeutImiter(liste.data, locals) };
};

/** Marque les dossiers dont le CFA émetteur peut être imité en lecture seule par l'organisation connectée. */
async function withPeutImiter(dossiers: ICollaborationDossier[], locals: IndicateursMlLocals) {
  const ids = [...new Set(dossiers.map((dossier) => dossier.cfa.id).filter((id) => ObjectId.isValid(id)))];
  const organismes = ids.length
    ? await organismesDb()
        .find(
          { _id: { $in: ids.map((id) => new ObjectId(id)) } },
          { projection: { "adresse.region": 1, "adresse.departement": 1 } }
        )
        .toArray()
    : [];
  const adresses = new Map(organismes.map((organisme) => [organisme._id.toString(), organisme.adresse]));
  return dossiers.map((dossier) => ({
    ...dossier,
    peut_imiter: peutImiter(locals, "cfa", adresses.get(dossier.cfa.id)),
  }));
}

const getCollaborationDossiersExportRoute: IndicateursHandler<
  z.infer<typeof collaborationDossiersExportQuery>
> = async (req, { locals }) => {
  const result = await listCollaborationDossiers(
    await resolveCollaborationDossiersScope(req.query, locals),
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

const getRechercheRoute: IndicateursHandler<z.infer<typeof rechercheQuery>> = async (req) => {
  const { q, page, limit } = req.query;
  return await rechercherEtablissements(q, undefined, { page, limit });
};

const getTraitementMLRoute: IndicateursHandler<z.infer<typeof traitementMlQuery>> = async (req, { locals }) => {
  const { period, segment, page, limit, sort_by, sort_order, search, departements, utilise_service, engagee } =
    req.query;
  assertDepartementsConnus(departements);
  const territoire = resolveTerritoire(req.query, locals.regions);

  return await getTraitementStatsByMissionLocale({
    period: period || "30days",
    segment,
    regions: territoire.regions,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sort_by,
    sort_order: sort_order || "desc",
    search,
    departements: territoire.departements ?? departements,
    utiliseService: utilise_service,
    engagee,
  });
};

const getTraitementRegionsRoute: IndicateursHandler<z.infer<typeof traitementRegionsQuery>> = async (
  req,
  { locals }
) => {
  const { regions } = resolveTerritoire(req.query, locals.regions);
  const allRegions = await getSuiviTraitementByRegion(req.query.segment);
  return regions ? allRegions.filter((r) => regions.includes(r.code)) : allRegions;
};

const getTraitementExportRoute: IndicateursHandler<z.infer<typeof exportQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getTraitementExportData({ ...scope.territoire, mlId: scope.mlId });
};

const getCfaAdoptionRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getCfaAdoptionStats(req.query.period || "30days", scope.territoire);
};

const findCfaEtablissements = (query: z.infer<typeof cfaEtablissementsExportQuery>, userRegions: string[]) => {
  const { departements, search, natures, utilisateur, qualiopi, collab_active, sort_by, sort_order } = query;

  assertDepartementsConnus(departements);
  const territoire = resolveTerritoire(query, userRegions);

  return listCfaEtablissements({
    regions: territoire.regions,
    departements: territoire.departements ?? departements,
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

const cfaInvitesOptions = (query: TerritoireQuery, userRegions: string[]) => ({
  territoire: resolveTerritoire(query, userRegions),
});

const getCfaInvitesRoute: IndicateursHandler<z.infer<typeof cfaInvitesQuery>> = async (req, { locals }) =>
  getCfaInvitesSansCollab(req.query, cfaInvitesOptions(req.query, locals.regions));

const getCfaInvitesExportRoute: IndicateursHandler<z.infer<typeof cfaInvitesExportQuery>> = async (
  req,
  { locals }
) => ({ data: await listCfaInvitesSansCollab(req.query, cfaInvitesOptions(req.query, locals.regions)) });

const getCfaNpsRoute: IndicateursHandler<z.infer<typeof syntheseQuery>> = async (req, { locals }) => {
  const scope = await resolveStatsScope(req.query, locals.regions);

  return await getCfaNpsStats(scope.territoire);
};

const findCfaInjoignables = (query: z.infer<typeof cfaInjoignablesExportQuery>, userRegions: string[]) =>
  listCfaInjoignables(resolveTerritoire(query, userRegions), query);

const getCollabCfaOrigineRoute: IndicateursHandler<z.infer<typeof collabCfaOrigineQuery>> = async (req) => {
  const { ml_id, ...options } = req.query;
  await findMlOrThrow(ml_id);
  return listCollaborationsCfaOrigine(new ObjectId(ml_id), options);
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

const findMlAlertes = (
  type: z.infer<typeof mlAlertesParams>["type"],
  query: z.infer<typeof mlAlertesExportQuery>,
  userRegions: string[]
) => listMlAlertes(type, resolveTerritoire(query, userRegions), query);

const getMlAlertesRoute: IndicateursHandler<z.infer<typeof mlAlertesQuery>, z.infer<typeof mlAlertesParams>> = async (
  req,
  { locals }
) => {
  const { page, limit } = req.query;
  const rows = await findMlAlertes(req.params.type, req.query, locals.regions);

  return {
    total: rows.length,
    pagination: { page, limit, total_pages: Math.ceil(rows.length / limit) },
    data: rows.slice((page - 1) * limit, page * limit),
  };
};

const getMlAlertesExportRoute: IndicateursHandler<
  z.infer<typeof mlAlertesExportQuery>,
  z.infer<typeof mlAlertesParams>
> = async (req, { locals }) => ({ data: await findMlAlertes(req.params.type, req.query, locals.regions) });

const getCouvertureDepartementsRoute: IndicateursHandler<z.infer<typeof couvertureDepartementsQuery>> = async (req) =>
  getDepartementalStats(req.query.period || "30days", req.query.region);

const getCouvertureRegionsRoute: IndicateursHandler<z.infer<typeof nationalQuery>> = async (req, { locals }) => {
  const { regions } = resolveTerritoire(req.query, locals.regions);
  const stats = await getCouvertureRegionsStats(req.query.period || "30days");
  return regions ? { ...stats, regions: stats.regions.filter((r) => regions.includes(r.code)) } : stats;
};

const getMlDetailRoute: IndicateursHandler<DefaultQuery, z.infer<typeof mlIdParams>> = async (req, { locals }) => {
  const { nominatif, imitable } = await verifyMlInScope(req.params.id, locals);

  const mlId = new ObjectId(req.params.id);
  const [detail, indicateurs] = await Promise.all([
    getMissionLocaleDetail(mlId),
    getMissionLocaleFicheIndicateurs(mlId),
  ]);
  return { ...detail, indicateurs, peut_voir_nominatif: nominatif, peut_imiter: imitable };
};

const getMlMembresRoute: IndicateursHandler<DefaultQuery, z.infer<typeof mlIdParams>> = async (req, { locals }) => {
  const { nominatif } = await verifyMlInScope(req.params.id, locals);
  if (!nominatif) {
    throw Boom.forbidden("Accès non autorisé à l'équipe de cette Mission Locale");
  }

  return getMissionLocaleMembers(new ObjectId(req.params.id));
};

const getCfaDetailRoute: IndicateursHandler<DefaultQuery, z.infer<typeof organismeIdParams>> = async (
  req,
  { locals }
) => {
  const { nominatif, imitable } = await verifyOrganismeInScope(req.params.id, locals);
  return { ...(await getCfaFiche(new ObjectId(req.params.id), { nominatif })), peut_imiter: imitable };
};

const getCfaCollaborationsRoute: IndicateursHandler<DefaultQuery, z.infer<typeof organismeIdParams>> = async (
  req,
  { locals }
) => {
  await verifyOrganismeInScope(req.params.id, locals);
  return getCfaCollaborationStats(new ObjectId(req.params.id));
};

const getCfaCollaborationsMlRoute: IndicateursHandler<
  z.infer<typeof cfaCollabMlQuery>,
  z.infer<typeof organismeIdParams>
> = async (req, { locals }) => {
  await verifyOrganismeInScope(req.params.id, locals);
  return listCfaCollaborationsParMl(new ObjectId(req.params.id), req.query);
};

const getCfaMembresRoute: IndicateursHandler<DefaultQuery, z.infer<typeof organismeIdParams>> = async (
  req,
  { locals }
) => {
  const { nominatif } = await verifyOrganismeInScope(req.params.id, locals);
  if (!nominatif) {
    throw Boom.forbidden("Accès non autorisé à l'équipe de cet organisme");
  }
  return getCfaMembres(new ObjectId(req.params.id));
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

/**
 * POST /api/v1/organisation/indicateurs-ml/impersonate
 * Imposture en lecture seule : la DREETS et la DDETS sur un CFA de leur territoire, l'ARML sur une Mission Locale
 * de ses régions. L'administrateur ouvre une imposture classique (écriture possible) sur n'importe quel CFA.
 */
const impersonateRoute: RouteHandler<
  IndicateursMlLocals,
  DefaultParams,
  DefaultQuery,
  z.infer<typeof impersonateBody>
> = async (req, res) => {
  const locals = res.locals;
  const user = req.user as AuthContext;
  const { type } = locals.organisation;

  let cible: Awaited<ReturnType<typeof findImpersonationTarget>>;
  if (
    req.body.cfa_id &&
    (type === ORGANISATION_TYPE.ADMINISTRATEUR || type === ORGANISATION_TYPE.DREETS || type === ORGANISATION_TYPE.DDETS)
  ) {
    cible = await findImpersonationTarget("cfa", req.body.cfa_id, locals);
  } else if (req.body.ml_id && type === ORGANISATION_TYPE.ARML) {
    cible = await findImpersonationTarget("ml", req.body.ml_id, locals);
  } else {
    throw Boom.forbidden("Imposture non autorisée pour votre organisation");
  }

  const readOnly = type !== ORGANISATION_TYPE.ADMINISTRATEUR;
  logger.info(
    {
      event: readOnly ? "imposture_lecture_seule" : "imposture_admin",
      utilisateur_id: user._id.toString(),
      depuis_imposture_admin: user.impersonating === true,
      organisation_origine: { id: locals.organisation._id.toString(), type },
      cible: { id: cible._id.toString(), type: cible.type },
    },
    readOnly ? "Imposture en lecture seule" : "Imposture administrateur"
  );

  const sessionToken = await createSession(user.email, {
    impersonatedOrganisation: cible,
    ...(readOnly && { readOnly }),
  });
  responseWithCookie(res, sessionToken);
};

async function findImpersonationTarget(kind: "cfa" | "ml", id: string, locals: IndicateursMlLocals) {
  if (kind === "cfa") {
    const organisme = await organismesDb().findOne(
      { _id: new ObjectId(id) },
      { projection: { "adresse.region": 1, "adresse.departement": 1 } }
    );
    if (!organisme) {
      throw Boom.notFound("Organisme non trouvé");
    }
    if (!peutImiter(locals, "cfa", organisme.adresse)) {
      throw Boom.forbidden("Accès non autorisé à cet organisme");
    }
    const organisation = await getOrganisationOrganismeByOrganismeId(organisme._id);
    if (!organisation) {
      throw Boom.notFound("Organisation du CFA non trouvée");
    }
    return organisation;
  }

  const ml = await organisationsDb().findOne({ _id: new ObjectId(id), type: "MISSION_LOCALE" });
  if (!ml) {
    throw Boom.notFound(`Mission Locale non trouvée: ${id}`);
  }
  if (!peutImiter(locals, "ml", (ml as { adresse?: { region?: string } }).adresse)) {
    throw Boom.forbidden("Accès non autorisé à cette Mission Locale");
  }
  return ml;
}

/** Fiche CFA, ouverte à tous les territoires : 404 si l'organisme est inconnu. */
async function verifyOrganismeInScope(id: string, locals: IndicateursMlLocals) {
  const organisme = await organismesDb().findOne(
    { _id: new ObjectId(id) },
    { projection: { "adresse.region": 1, "adresse.departement": 1 } }
  );
  if (!organisme) {
    throw Boom.notFound("Organisme non trouvé");
  }
  return {
    nominatif: peutVoirNominatif(locals, organisme.adresse),
    imitable: peutImiter(locals, "cfa", organisme.adresse),
  };
}

/**
 * Données nominatives (équipe, liste des jeunes, contacts) : jamais pour l'ARML, la DREETS dans sa région,
 * la DDETS dans son département.
 */
const peutVoirNominatif = (
  { organisation, regions }: IndicateursMlLocals,
  structure?: { region?: string | null; departement?: string | null } | null
) => {
  switch (organisation.type) {
    case ORGANISATION_TYPE.ADMINISTRATEUR:
      return true;
    case ORGANISATION_TYPE.DREETS:
      return !!structure?.region && regions.includes(structure.region);
    case ORGANISATION_TYPE.DDETS: {
      const departement = (organisation as { code_departement?: string }).code_departement;
      return !!departement && departement === structure?.departement;
    }
    default:
      return false;
  }
};

/**
 * Imposture : l'administrateur sur tout CFA, la DREETS et la DDETS sur un CFA de leur territoire (en lecture seule),
 * l'ARML sur une Mission Locale de ses régions (en lecture seule).
 */
const peutImiter = (
  locals: IndicateursMlLocals,
  cible: "cfa" | "ml",
  structure?: { region?: string | null; departement?: string | null } | null
) => {
  const { type } = locals.organisation;
  if (cible === "cfa") {
    return (
      type === ORGANISATION_TYPE.ADMINISTRATEUR ||
      ((type === ORGANISATION_TYPE.DREETS || type === ORGANISATION_TYPE.DDETS) && peutVoirNominatif(locals, structure))
    );
  }
  return type === ORGANISATION_TYPE.ARML && !!structure?.region && locals.regions.includes(structure.region);
};

async function verifyMlInScope(mlId: string, locals: IndicateursMlLocals) {
  const ml = await findMlOrThrow(mlId);
  const adresse = (ml as { adresse?: { region?: string; departement?: string } }).adresse;
  return { nominatif: peutVoirNominatif(locals, adresse), imitable: peutImiter(locals, "ml", adresse) };
}

async function findMlOrThrow(mlId: string) {
  const ml = await organisationsDb().findOne(
    { _id: new ObjectId(mlId), type: "MISSION_LOCALE" },
    { projection: { "adresse.region": 1, "adresse.departement": 1 } }
  );
  if (!ml) {
    throw Boom.notFound(`Mission Locale non trouvée: ${mlId}`);
  }
  return ml;
}

export { getRegionsFromOrganisation };
