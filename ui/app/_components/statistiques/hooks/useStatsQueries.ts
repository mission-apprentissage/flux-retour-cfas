import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type {
  IAccompagnementConjointStats,
  IDetailsDossiersTraites,
  IRegionStats,
  IRupturantsSummary,
  ITimeSeriesPoint,
  ITraitementMLStatsResponse,
  ITraitementRegionStats,
  ITraitementStatsResponse,
} from "shared/models/data/nationalStats.model";

import { _get } from "@/common/httpClient";

import type { Period } from "../ui/PeriodSelector";

interface IDeploymentStatsResponse {
  summary: {
    mlCount: number;
    activatedMlCount: number;
    previousActivatedMlCount: number;
    engagedMlCount: number;
    previousEngagedMlCount: number;
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
}

interface IDossiersTraitesStatsResponse {
  details: IDetailsDossiersTraites;
  evaluationDate: Date;
  period: Period;
}

interface ICouvertureRegionsStatsResponse {
  regions: IRegionStats[];
  period: Period;
}

const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export const STATS_QUERY_CONFIG = {
  staleTime: THIRTY_MINUTES,
  cacheTime: ONE_HOUR,
  retry: 3,
  refetchOnWindowFocus: false,
} as const;

export const STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA = {
  ...STATS_QUERY_CONFIG,
  keepPreviousData: true,
} as const;

function buildStatsParams(params: {
  period?: Period;
  region?: string;
  mlId?: string;
  national?: boolean;
}): Record<string, unknown> {
  return {
    ...(params.period && { period: params.period }),
    ...(params.region && { region: params.region }),
    ...(params.mlId && { ml_id: params.mlId }),
    ...(params.national && { national: true }),
  };
}

export const statsQueryKeys = {
  traitement: (period: Period, region?: string) => ["stats", "traitement", period, region] as const,
  deployment: (period: Period) => ["stats", "deployment", period] as const,
  syntheseRegions: (period: Period) => ["stats", "synthese-regions", period] as const,
  rupturants: (period: Period, region?: string, mlId?: string) =>
    ["stats", "rupturants", period, region, mlId] as const,
  dossiersTraites: (period: Period, region?: string, mlId?: string) =>
    ["stats", "dossiers-traites", period, region, mlId] as const,
  couvertureRegions: (period: Period) => ["stats", "couverture-regions", period] as const,
  traitementML: (params: TraitementMLParams) => ["stats", "traitement-ml", params] as const,
  traitementRegions: (period: Period) => ["stats", "traitement-regions", period] as const,
  accompagnementConjoint: (region?: string, mlId?: string) =>
    ["stats", "accompagnement-conjoint", region, mlId] as const,
  missionLocaleDetail: (mlId: string) => ["stats", "ml-detail", mlId] as const,
  missionLocaleMembres: (mlId: string) => ["stats", "ml-membres", mlId] as const,
};

export interface TraitementMLParams {
  period: Period;
  region?: string;
  page: number;
  limit: number;
  sort_by: string;
  sort_order: "asc" | "desc";
  search?: string;
}

function buildTraitementMLRequestParams(params: TraitementMLParams): Record<string, unknown> {
  return {
    period: params.period,
    ...(params.region && { region: params.region }),
    page: params.page,
    limit: params.limit,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    ...(params.search && { search: params.search }),
  };
}

export function useTraitementStats(period: Period, region?: string) {
  return useQuery<ITraitementStatsResponse>(
    statsQueryKeys.traitement(period, region),
    () =>
      _get("/api/v1/mission-locale/stats/traitement", {
        params: { period, ...(region && { region }) },
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useDeploymentStats(period: Period) {
  return useQuery<IDeploymentStatsResponse>(
    statsQueryKeys.deployment(period),
    () => _get("/api/v1/mission-locale/stats/synthese/deployment", { params: { period } }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useSyntheseRegionsStats(period: Period) {
  return useQuery<ISyntheseRegionsStatsResponse>(
    statsQueryKeys.syntheseRegions(period),
    () => _get("/api/v1/mission-locale/stats/synthese/regions", { params: { period } }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useRupturantsStats(period: Period, region?: string, mlId?: string, national?: boolean) {
  return useQuery<IRupturantsStatsResponse>(
    [...statsQueryKeys.rupturants(period, region, mlId), national] as const,
    () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/rupturants", {
        params: buildStatsParams({ period, region, mlId, national }),
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useDossiersTraitesStats(period: Period, region?: string, mlId?: string, national?: boolean) {
  return useQuery<IDossiersTraitesStatsResponse>(
    [...statsQueryKeys.dossiersTraites(period, region, mlId), national] as const,
    () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/dossiers-traites", {
        params: buildStatsParams({ period, region, mlId, national }),
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useCouvertureRegionsStats(period: Period, national?: boolean) {
  return useQuery<ICouvertureRegionsStatsResponse>(
    [...statsQueryKeys.couvertureRegions(period), national] as const,
    () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/couverture-regions", {
        params: buildStatsParams({ period, national }),
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
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

export function useTraitementRegionsStats(period: Period, national?: boolean) {
  return useQuery<ITraitementRegionStats[]>(
    [...statsQueryKeys.traitementRegions(period), national] as const,
    () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/traitement/regions", {
        params: buildStatsParams({ period, national }),
      }),
    STATS_QUERY_CONFIG
  );
}

export function useAccompagnementConjointStats(region?: string, mlId?: string, national?: boolean) {
  return useQuery<IAccompagnementConjointStats>(
    [...statsQueryKeys.accompagnementConjoint(region, mlId), national] as const,
    () =>
      _get("/api/v1/organisation/indicateurs-ml/stats/accompagnement-conjoint", {
        params: buildStatsParams({ region, mlId, national }),
      }),
    STATS_QUERY_CONFIG
  );
}

export interface IMissionLocaleMemberResponse {
  _id: string;
  civility: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  last_traitement_at: string | null;
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
    adresse?: {
      commune?: string;
      code_postal?: string;
      localite?: string;
    };
  };
  activated_at: string | null;
  last_activity_at: string | null;
  has_cfa_collaboration: boolean;
  traites_count: number;
}

export function useMissionLocaleDetail(mlId: string) {
  return useQuery<IMissionLocaleDetailResponse>(
    statsQueryKeys.missionLocaleDetail(mlId),
    () => _get(`/api/v1/organisation/indicateurs-ml/mission-locale/${mlId}/detail`),
    {
      ...STATS_QUERY_CONFIG,
      enabled: !!mlId,
    }
  );
}

export function useMissionLocaleMembres(mlId: string) {
  return useQuery<IMissionLocaleMemberResponse[]>(
    statsQueryKeys.missionLocaleMembres(mlId),
    () => _get(`/api/v1/organisation/indicateurs-ml/mission-locale/${mlId}/membres`),
    {
      ...STATS_QUERY_CONFIG,
      enabled: !!mlId,
    }
  );
}
