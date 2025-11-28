/**
 * Hooks React Query centralisés pour les statistiques
 *
 * Chaque hook est indépendant et peut être utilisé par les sections
 * pour récupérer leurs propres données.
 */

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

export const statsQueryKeys = {
  traitement: (period: Period, region?: string) => ["stats", "traitement", period, region] as const,
  deployment: (period: Period) => ["stats", "deployment", period] as const,
  syntheseRegions: (period: Period) => ["stats", "synthese-regions", period] as const,
  rupturants: (period: Period, region?: string) => ["stats", "rupturants", period, region] as const,
  dossiersTraites: (period: Period, region?: string) => ["stats", "dossiers-traites", period, region] as const,
  couvertureRegions: (period: Period) => ["stats", "couverture-regions", period] as const,
  traitementML: (params: TraitementMLParams) => ["stats", "traitement-ml", params] as const,
  traitementRegions: (period: Period) => ["stats", "traitement-regions", period] as const,
  accompagnementConjoint: (region?: string) => ["stats", "accompagnement-conjoint", region] as const,
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

export function useRupturantsStats(period: Period, region?: string) {
  return useQuery<IRupturantsStatsResponse>(
    statsQueryKeys.rupturants(period, region),
    () =>
      _get("/api/v1/admin/mission-locale/stats/national/rupturants", {
        params: { period, ...(region && { region }) },
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useDossiersTraitesStats(period: Period, region?: string) {
  return useQuery<IDossiersTraitesStatsResponse>(
    statsQueryKeys.dossiersTraites(period, region),
    () =>
      _get("/api/v1/admin/mission-locale/stats/national/dossiers-traites", {
        params: { period, ...(region && { region }) },
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useCouvertureRegionsStats(period: Period) {
  return useQuery<ICouvertureRegionsStatsResponse>(
    statsQueryKeys.couvertureRegions(period),
    () => _get("/api/v1/admin/mission-locale/stats/national/couverture-regions", { params: { period } }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function useTraitementMLStats(params: TraitementMLParams) {
  return useQuery<ITraitementMLStatsResponse>(
    statsQueryKeys.traitementML(params),
    () =>
      _get("/api/v1/admin/mission-locale/stats/traitement/ml", {
        params: {
          period: params.period,
          ...(params.region && { region: params.region }),
          page: params.page,
          limit: params.limit,
          sort_by: params.sort_by,
          sort_order: params.sort_order,
          ...(params.search && { search: params.search }),
        },
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );
}

export function usePrefetchTraitementML() {
  const queryClient = useQueryClient();

  return useCallback(
    (params: TraitementMLParams) => {
      queryClient.prefetchQuery({
        queryKey: statsQueryKeys.traitementML(params),
        queryFn: () =>
          _get("/api/v1/admin/mission-locale/stats/traitement/ml", {
            params: {
              period: params.period,
              ...(params.region && { region: params.region }),
              page: params.page,
              limit: params.limit,
              sort_by: params.sort_by,
              sort_order: params.sort_order,
              ...(params.search && { search: params.search }),
            },
          }),
        staleTime: STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA.staleTime,
      });
    },
    [queryClient]
  );
}

export function useTraitementRegionsStats(period: Period) {
  return useQuery<ITraitementRegionStats[]>(
    statsQueryKeys.traitementRegions(period),
    () => _get("/api/v1/admin/mission-locale/stats/traitement/regions", { params: { period } }),
    STATS_QUERY_CONFIG
  );
}

export function useAccompagnementConjointStats(region?: string) {
  return useQuery<IAccompagnementConjointStats>(
    statsQueryKeys.accompagnementConjoint(region),
    () =>
      _get("/api/v1/admin/mission-locale/stats/accompagnement-conjoint", {
        params: region ? { region } : {},
      }),
    STATS_QUERY_CONFIG
  );
}
