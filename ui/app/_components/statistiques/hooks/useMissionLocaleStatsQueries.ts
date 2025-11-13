import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import { RegionStats } from "../RegionTable";

export const missionLocaleStatsQueryKeys = {
  all: ["mission-locale-stats"] as const,
  summary: (period: "30days" | "3months" | "all") => [...missionLocaleStatsQueryKeys.all, "summary", period] as const,
  regional: (period: "30days" | "3months" | "all") => [...missionLocaleStatsQueryKeys.all, "regional", period] as const,
};

interface SummaryStats {
  summary: Array<{
    date: Date;
    stats: Array<{
      total: number;
      total_traites: number;
      total_a_traiter: number;
      total_contacte: number;
      total_repondu: number;
      total_accompagne: number;
      rdv_pris: number;
      nouveau_projet: number;
      deja_accompagne: number;
      contacte_sans_retour: number;
      coordonnees_incorrectes: number;
      autre: number;
      deja_connu: number;
    }>;
  }>;
  arml: Array<{
    date: Date;
    stats: any[];
  }>;
  mlCount: number;
  activatedMlCount: number;
  previousActivatedMlCount: number;
  date: Date;
}

interface RegionalStatsResponse {
  regions: RegionStats[];
}

const fetchSummaryStats = async (period: "30days" | "3months" | "all"): Promise<SummaryStats> => {
  return _get(`/api/v1/mission-locale/stats/summary`, { params: { period } });
};

const fetchRegionalStats = async (period: "30days" | "3months" | "all"): Promise<RegionalStatsResponse> => {
  return _get(`/api/v1/mission-locale/stats/regions`, { params: { period } });
};

const STATS_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
  retry: 3,
  refetchOnWindowFocus: false,
} as const;

export function useSummaryStats(period: "30days" | "3months" | "all") {
  return useQuery(missionLocaleStatsQueryKeys.summary(period), () => fetchSummaryStats(period), STATS_QUERY_CONFIG);
}

export function useRegionalStats(period: "30days" | "3months" | "all") {
  return useQuery(missionLocaleStatsQueryKeys.regional(period), () => fetchRegionalStats(period), STATS_QUERY_CONFIG);
}
