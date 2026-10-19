import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type {
  IRechercheResponse,
  CollabCfaOrigineSortBy,
  CollabDossierStatut,
  ICollabCfaOrigineResponse,
  CfaCollabMlSortBy,
  ICfaCollabMlResponse,
  ICfaCollaborationStats,
  ICfaFiche,
  ICfaMembre,
  ICollaborationDossiersResponse,
  CfaEtablissementsSortBy,
  CfaInjoignablesSortBy,
  ICfaInjoignablesRow,
  ICfaNpsStats,
  ICfaEtablissementsResponse,
  ICollaborationMensuelStats,
  ICollaborationSegmentStats,
  IDossiersTraitesStatsResponse,
  IMlFicheIndicateurs,
  IPrequalifStats,
  ICfaAdoptionStats,
  IDepartementStats,
  IRegionStats,
  IRupturantsSummary,
  ITimeSeriesPoint,
  ITraitementMLStatsResponse,
  ITraitementRegionStats,
  ITraitementStatsResponse,
  IWhatsAppStats,
  StatsSegment,
  TraitementMlSortBy,
  IMlAlerteListeResponse,
  MlAlerteListeSortBy,
  MlAlerteListeType,
  ICollabCorrelationsResponse,
} from "shared/models/data/nationalStats.model";
import { RECHERCHE_LONGUEUR_MIN } from "shared/models/data/nationalStats.model";
import type {
  ICfaInvitesSansCollabResponse,
  ICfaInvitesSortBy,
} from "shared/models/routes/admin/cfa-invites-sans-collab.api";
import type { ICollaborationsCfaSyntheseResponse } from "shared/models/routes/admin/collaboration-stats.api";

import { _get, _put } from "@/common/httpClient";

import type { Period } from "../ui/PeriodSelector";

import {
  buildCollaborationsRequest,
  buildSegmentStatsRequest,
  buildSyntheseRequest,
  INDICATEURS_ML_BASE,
  buildTraitementRequest,
  type CollaborationStatsParams,
  type SegmentStatsParams,
} from "./statsRoutes";

export type { CollaborationStatsParams, SegmentStatsParams };

interface IDeploymentStatsResponse {
  summary: {
    mlCount: number;
    activatedMlCount: number;
    previousActivatedMlCount: number;
    engagedMlCount: number;
    previousEngagedMlCount: number;
    /** Variations calculées par le serveur : ML activées sur la période vs la précédente, ML engagées vs début de période. */
    activatedMlVariation: string;
    engagedMlVariation: string;
    date: string;
  };
  regionsActives: string[];
  evaluationDate: Date;
  period: Period;
}

interface ISyntheseRegionsStatsResponse {
  regions: IRegionStats[];
  period: Period;
}

interface IRupturantsStatsResponse {
  timeSeries: ITimeSeriesPoint[];
  summary: IRupturantsSummary;
  evaluationDate: Date;
  period: Period;
  segment: StatsSegment;
}

interface ICouvertureRegionsStatsResponse {
  regions: IRegionStats[];
  period: Period;
}

const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const NON_RETRYABLE_STATUS = [400, 401, 403, 404];

export const STATS_QUERY_CONFIG = {
  staleTime: THIRTY_MINUTES,
  gcTime: ONE_HOUR,
  retry: (failureCount: number, error: unknown) =>
    !NON_RETRYABLE_STATUS.includes((error as { statusCode?: number }).statusCode ?? 0) && failureCount < 3,
  refetchOnWindowFocus: false,
} as const;

export const STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA = {
  ...STATS_QUERY_CONFIG,
  placeholderData: keepPreviousData,
} as const;

function buildStatsParams(params: {
  period?: Period;
  region?: string;
  mlId?: string;
  national?: boolean;
  segment?: StatsSegment;
}): Record<string, unknown> {
  return {
    ...(params.period && { period: params.period }),
    ...(params.region && { region: params.region }),
    ...(params.mlId && { ml_id: params.mlId }),
    ...(params.national && { national: true }),
    ...(params.segment && { segment: params.segment }),
  };
}

export const statsQueryKeys = {
  traitement: (params: SegmentStatsParams) => ["stats", "traitement", params] as const,
  deployment: (period: Period, region?: string) => ["stats", "deployment", period, region] as const,
  syntheseRegions: (period: Period, region?: string) => ["stats", "synthese-regions", period, region] as const,
  rupturants: (params: SegmentStatsParams) => ["stats", "rupturants", params] as const,
  dossiersTraites: (params: SegmentStatsParams) => ["stats", "dossiers-traites", params] as const,
  couvertureRegions: (period: Period) => ["stats", "couverture-regions", period] as const,
  couvertureDepartements: (period: Period, region: string) =>
    ["stats", "couverture-departements", period, region] as const,
  traitementML: (params: TraitementMLParams) => ["stats", "traitement-ml", params] as const,
  traitementRegions: (period: Period, segment: StatsSegment) =>
    ["stats", "traitement-regions", period, segment] as const,
  collaborations: (params: CollaborationStatsParams) => ["stats", "collaborations", params] as const,
  collaborationsCfa: () => ["stats", "collaborations-cfa"] as const,
  missionLocaleDetail: (mlId: string) => ["stats", "ml-detail", mlId] as const,
  missionLocaleMembres: (mlId: string) => ["stats", "ml-membres", mlId] as const,
  whatsapp: (period: Period) => ["stats", "whatsapp", period] as const,
  prequalif: (period: Period) => ["stats", "prequalif", period] as const,
};

export interface TraitementMLParams {
  period: Period;
  segment: StatsSegment;
  region?: string;
  page: number;
  limit: number;
  sort_by: TraitementMlSortBy;
  sort_order: "asc" | "desc";
  search?: string;
  departements?: string[];
  utilise_service?: boolean;
  engagee?: boolean;
}

/** Listes de structures : sans région, la vue France couvre tout le pays (le serveur retomberait sinon sur le territoire de l'utilisateur). */
export const avecVueFrance = <T extends { region?: string }>(params: T) =>
  params.region ? params : { ...params, national: true };

function buildTraitementMLRequestParams(params: TraitementMLParams): Record<string, unknown> {
  return {
    period: params.period,
    segment: params.segment,
    ...(params.region ? { region: params.region } : { national: true }),
    page: params.page,
    limit: params.limit,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    ...(params.search && { search: params.search }),
    ...(params.departements?.length && { departements: params.departements.join(",") }),
    ...(params.utilise_service !== undefined && { utilise_service: params.utilise_service }),
    ...(params.engagee !== undefined && { engagee: params.engagee }),
  };
}

export function useTraitementStats(params: SegmentStatsParams) {
  const request = buildTraitementRequest(params);
  return useQuery<ITraitementStatsResponse>({
    queryKey: statsQueryKeys.traitement(params),
    queryFn: () => _get(request.url, { params: request.params }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useDeploymentStats(period: Period, region?: string) {
  const request = buildSyntheseRequest("deployment", period, region);
  return useQuery<IDeploymentStatsResponse>({
    queryKey: statsQueryKeys.deployment(period, region),
    queryFn: () => _get(request.url, { params: request.params }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useSyntheseRegionsStats(period: Period, region?: string) {
  const request = buildSyntheseRequest("regions", period, region);
  return useQuery<ISyntheseRegionsStatsResponse>({
    queryKey: statsQueryKeys.syntheseRegions(period, region),
    queryFn: () => _get(request.url, { params: request.params }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useRupturantsStats(params: SegmentStatsParams) {
  const request = buildSegmentStatsRequest("rupturants", params);
  return useQuery<IRupturantsStatsResponse>({
    queryKey: statsQueryKeys.rupturants(params),
    queryFn: () => _get(request.url, { params: request.params }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useDossiersTraitesStats(params: SegmentStatsParams) {
  const request = buildSegmentStatsRequest("dossiers-traites", params);
  return useQuery<IDossiersTraitesStatsResponse>({
    queryKey: statsQueryKeys.dossiersTraites(params),
    queryFn: () => _get(request.url, { params: request.params }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useCfaAdoptionStats(period: Period, scope: { region?: string; national?: boolean }) {
  return useQuery<ICfaAdoptionStats>({
    queryKey: ["stats", "cfa-adoption", period, scope.region ?? "national"] as const,
    queryFn: () => _get(`${INDICATEURS_ML_BASE}/stats/cfa/adoption`, { params: { period, ...scope } }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export interface CfaEtablissementsParams {
  region?: string;
  departements?: string[];
  search?: string;
  natures?: string[];
  utilisateur?: boolean;
  qualiopi?: boolean;
  collab_active?: boolean;
  sort_by: CfaEtablissementsSortBy;
  sort_order: "asc" | "desc";
}

export const buildCfaEtablissementsRequestParams = (params: CfaEtablissementsParams) => ({
  ...avecVueFrance(params),
  departements: params.departements?.join(","),
  natures: params.natures?.join(","),
});

export function useCfaEtablissements(params: CfaEtablissementsParams & { page: number; limit: number }) {
  return useQuery<ICfaEtablissementsResponse>({
    queryKey: ["stats", "cfa-etablissements", params] as const,
    queryFn: ({ signal }) =>
      _get(`${INDICATEURS_ML_BASE}/stats/cfa/etablissements`, {
        params: buildCfaEtablissementsRequestParams(params),
        signal,
      }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

type DatesEnTexte<T, K extends keyof T> = Omit<T, K> & Record<K, string | null>;

export type ICfaFicheResponse = Omit<DatesEnTexte<ICfaFiche, "derniere_activite_at">, "source_donnees"> & {
  source_donnees: ICfaFiche["source_donnees"];
};

export function useCfaFiche(organismeId: string) {
  return useQuery<ICfaFicheResponse>({
    queryKey: ["stats", "cfa-fiche", organismeId] as const,
    queryFn: () => _get(`${INDICATEURS_ML_BASE}/cfa/${organismeId}/detail`),
    ...STATS_QUERY_CONFIG,
    enabled: !!organismeId,
  });
}

export type ICfaMembreResponse = DatesEnTexte<ICfaMembre, "derniere_activite_at" | "activation_at">;

export const cfaMembresQueryKey = (organismeId: string) => ["stats", "cfa-membres", organismeId] as const;

export function useCfaMembres(organismeId: string) {
  return useQuery<ICfaMembreResponse[]>({
    queryKey: cfaMembresQueryKey(organismeId),
    queryFn: () => _get(`${INDICATEURS_ML_BASE}/cfa/${organismeId}/membres`),
    ...STATS_QUERY_CONFIG,
  });
}

export function useCfaCollaborations(organismeId: string) {
  return useQuery<ICfaCollaborationStats>({
    queryKey: ["stats", "cfa-collaborations", organismeId] as const,
    queryFn: () => _get(`${INDICATEURS_ML_BASE}/cfa/${organismeId}/collaborations`),
    ...STATS_QUERY_CONFIG,
  });
}

export interface CfaCollabMlParams {
  organismeId: string;
  page: number;
  limit: number;
  sort_by: CfaCollabMlSortBy;
  sort_order: "asc" | "desc";
}

export function useCfaCollabMl({ organismeId, ...params }: CfaCollabMlParams) {
  return useQuery<ICfaCollabMlResponse>({
    queryKey: ["stats", "cfa-collab-ml", organismeId, params] as const,
    queryFn: ({ signal }) => _get(`${INDICATEURS_ML_BASE}/cfa/${organismeId}/collaborations/ml`, { params, signal }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export interface CollabCfaOrigineParams {
  mlId: string;
  page: number;
  limit: number;
  sort_by: CollabCfaOrigineSortBy;
  sort_order: "asc" | "desc";
}

export function useCollabCfaOrigine({ mlId, ...params }: CollabCfaOrigineParams) {
  return useQuery<ICollabCfaOrigineResponse>({
    queryKey: ["stats", "collab-cfa-origine", mlId, params] as const,
    queryFn: ({ signal }) =>
      _get(`${INDICATEURS_ML_BASE}/stats/collaborations/cfa-origine`, { params: { ml_id: mlId, ...params }, signal }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export interface CfaInvitesParams {
  region?: string;
  sort_by: ICfaInvitesSortBy;
  sort_order: "asc" | "desc";
}

export function useCfaInvitesSansCollabStats(params: CfaInvitesParams & { page: number; limit: number }) {
  return useQuery<ICfaInvitesSansCollabResponse>({
    queryKey: ["stats", "cfa-invites-sans-collab", params] as const,
    queryFn: ({ signal }) =>
      _get(`${INDICATEURS_ML_BASE}/stats/cfa/invites-sans-collab`, { params: avecVueFrance(params), signal }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export interface CfaInjoignablesParams {
  region?: string;
  sort_by: CfaInjoignablesSortBy;
  sort_order: "asc" | "desc";
}

export function useCfaInjoignablesStats(params: CfaInjoignablesParams & { page: number; limit: number }) {
  return useQuery<{
    total: number;
    pagination: { page: number; limit: number; total_pages: number };
    data: ICfaInjoignablesRow[];
  }>({
    queryKey: ["stats", "cfa-injoignables", params] as const,
    queryFn: ({ signal }) =>
      _get(`${INDICATEURS_ML_BASE}/stats/cfa/injoignables`, { params: avecVueFrance(params), signal }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export interface MlAlertesParams {
  region?: string;
  sort_by: MlAlerteListeSortBy;
  sort_order: "asc" | "desc";
}

export function useMlAlertes(type: MlAlerteListeType, params: MlAlertesParams & { page: number; limit: number }) {
  return useQuery<IMlAlerteListeResponse>({
    queryKey: ["stats", "ml-alertes", type, params] as const,
    queryFn: ({ signal }) =>
      _get(`${INDICATEURS_ML_BASE}/stats/ml/alertes/${type}`, { params: avecVueFrance(params), signal }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useCfaNpsStats(scope: { region?: string; national?: boolean }) {
  return useQuery<ICfaNpsStats>({
    queryKey: ["stats", "cfa-nps", scope.region ?? "national"] as const,
    queryFn: () => _get(`${INDICATEURS_ML_BASE}/stats/cfa/nps`, { params: scope }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export const COLLAB_DOSSIER_STATUT_LABELS: Record<CollabDossierStatut, string> = {
  a_traiter: "Demande envoyée par le CFA",
  a_recontacter: "À recontacter par la ML",
  traite: "Traité par la ML",
};

export interface CollaborationDossiersParams {
  region?: string;
  search?: string;
  departements?: string;
  statuts?: string;
  delais?: string;
  cfa_ids?: string;
  ml_ids?: string;
  ml_id?: string;
  cfa_id?: string;
  situations?: string;
  motifs?: string;
  resultats?: string;
  date_debut?: string;
  date_fin?: string;
}

export function useCollaborationDossiers(
  params: CollaborationDossiersParams & { page: number; limit: number },
  enabled = true
) {
  return useQuery<ICollaborationDossiersResponse>({
    queryKey: ["stats", "collaborations-dossiers", params] as const,
    queryFn: ({ signal }) => _get(`${INDICATEURS_ML_BASE}/stats/collaborations/dossiers`, { params, signal }),
    enabled,
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useRechercheEtablissements(q: string, page: number, limit: number) {
  return useQuery<IRechercheResponse>({
    queryKey: ["stats", "recherche", q, page, limit] as const,
    queryFn: ({ signal }) => _get(`${INDICATEURS_ML_BASE}/stats/recherche`, { params: { q, page, limit }, signal }),
    enabled: q.trim().length >= RECHERCHE_LONGUEUR_MIN,
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useCouvertureDepartementsStats(period: Period, region: string | undefined) {
  return useQuery<{ departements: IDepartementStats[] }>({
    queryKey: statsQueryKeys.couvertureDepartements(period, region ?? ""),
    queryFn: () =>
      _get(`${INDICATEURS_ML_BASE}/stats/couverture-departements`, {
        params: { period, region },
      }),
    enabled: !!region,
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useCouvertureRegionsStats(period: Period, national?: boolean) {
  return useQuery<ICouvertureRegionsStatsResponse>({
    queryKey: [...statsQueryKeys.couvertureRegions(period), national] as const,

    queryFn: () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/couverture-regions", {
        params: buildStatsParams({ period, national }),
      }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useTraitementMLStats(params: TraitementMLParams) {
  return useQuery<ITraitementMLStatsResponse>({
    queryKey: statsQueryKeys.traitementML(params),
    queryFn: ({ signal }) =>
      _get("/api/v1/organisation/indicateurs-ml/stats/traitement/ml", {
        params: buildTraitementMLRequestParams(params),
        signal,
      }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function usePrefetchTraitementML() {
  const queryClient = useQueryClient();

  return useCallback(
    (params: TraitementMLParams) => {
      queryClient.prefetchQuery({
        queryKey: statsQueryKeys.traitementML(params),
        queryFn: () =>
          _get("/api/v1/organisation/indicateurs-ml/stats/traitement/ml", {
            params: buildTraitementMLRequestParams(params),
          }),
        staleTime: STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA.staleTime,
      });
    },
    [queryClient]
  );
}

export function useTraitementRegionsStats(period: Period, national?: boolean, segment: StatsSegment = "all") {
  return useQuery<ITraitementRegionStats[]>({
    queryKey: [...statsQueryKeys.traitementRegions(period, segment), national] as const,

    queryFn: () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/traitement/regions", {
        params: buildStatsParams({ period, national, segment }),
      }),
    ...STATS_QUERY_CONFIG,
  });
}

export function useCollaborationSegmentStats(params: CollaborationStatsParams) {
  const request = buildCollaborationsRequest(params);
  return useQuery<ICollaborationSegmentStats>({
    queryKey: statsQueryKeys.collaborations(params),
    queryFn: () => _get(request.url, { params: request.params }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useCollaborationMensuelStats(params: CollaborationStatsParams) {
  const request = buildCollaborationsRequest(params);
  return useQuery<ICollaborationMensuelStats>({
    queryKey: ["stats", "collaborations-mensuel", request.params] as const,
    queryFn: () => _get(`${request.url}/mensuel`, { params: request.params }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useCollaborationCorrelations(params: CollaborationStatsParams) {
  const { url, params: query } = buildCollaborationsRequest(params);
  return useQuery<ICollabCorrelationsResponse>({
    queryKey: ["stats", "collaborations-correlations", query] as const,
    queryFn: () => _get(`${url}/correlations`, { params: query }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

export function useCollaborationsCfaPublic() {
  return useQuery<ICollaborationsCfaSyntheseResponse>({
    queryKey: statsQueryKeys.collaborationsCfa(),
    queryFn: () => _get("/api/v1/mission-locale/stats/synthese/collaborations-cfa"),
    ...STATS_QUERY_CONFIG,
  });
}

export interface IMissionLocaleMemberResponse {
  _id: string;
  civility: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  last_traitement_at: string | null;
  confirmed_at: string | null;
}

export interface IMissionLocaleDetailResponse {
  ml: {
    _id: string;
    ml_id: number;
    nom: string;
    siret?: string;
    email?: string;
    telephone?: string;
    site_web?: string;
    rdv_url?: string | null;
    adresse?: {
      numero?: number;
      repetition_voie?: string;
      voie?: string;
      complement?: string;
      departement?: string;
      commune?: string;
      code_postal?: string;
      localite?: string;
    };
  };
  activated_at: string | null;
  is_active: boolean;
  last_activity_at: string | null;
  has_cfa_collaboration: boolean;
  traites_count: number;
  peut_voir_nominatif: boolean;
  indicateurs: Omit<IMlFicheIndicateurs, "premier_compte_at" | "derniere_activite_at"> & {
    premier_compte_at: string | null;
    derniere_activite_at: string | null;
  };
}

export function useMissionLocaleDetail(mlId: string) {
  return useQuery<IMissionLocaleDetailResponse>({
    queryKey: statsQueryKeys.missionLocaleDetail(mlId),
    queryFn: () => _get(`/api/v1/organisation/indicateurs-ml/mission-locale/${mlId}/detail`),
    ...STATS_QUERY_CONFIG,
    enabled: !!mlId,
  });
}

export function useUpdateMlParametresAdmin(mlId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rdv_url: string | null }) => _put(`/api/v1/admin/mission-locale/${mlId}/parametres`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statsQueryKeys.missionLocaleDetail(mlId) });
    },
  });
}

export function useMissionLocaleMembres(mlId: string) {
  return useQuery<IMissionLocaleMemberResponse[]>({
    queryKey: statsQueryKeys.missionLocaleMembres(mlId),
    queryFn: () => _get(`/api/v1/organisation/indicateurs-ml/mission-locale/${mlId}/membres`),
    ...STATS_QUERY_CONFIG,
    enabled: !!mlId,
  });
}

export function useWhatsAppStats(period: Period) {
  return useQuery<IWhatsAppStats>({
    queryKey: statsQueryKeys.whatsapp(period),

    queryFn: () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/whatsapp", {
        params: { period },
      }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}

/**
 * Indicateurs préqualif WhatsApp (admin-only).
 */
export function usePrequalifStats(period: Period = "all") {
  return useQuery<IPrequalifStats>({
    queryKey: statsQueryKeys.prequalif(period),

    queryFn: () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/prequalif", {
        params: { period },
      }),
    ...STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA,
  });
}
