"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { _get } from "@/common/httpClient";

import type { Period } from "./PeriodSelector";
import { STATS_QUERY_CONFIG } from "./statistiques.config";

const PERIODS: Period[] = ["30days", "3months", "all"];

interface UseStatsPrefetchOptions {
  prefetchNational?: boolean;
}

export function useStatsPrefetch(
  currentView: "synthese" | "national",
  currentPeriod: Period,
  options: UseStatsPrefetchOptions = {}
) {
  const { prefetchNational = false } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentView === "national") {
      queryClient.prefetchQuery({
        queryKey: ["mission-locale-stats", "synthese", currentPeriod],
        queryFn: () => _get(`/api/v1/mission-locale/stats/synthese`, { params: { period: currentPeriod } }),
        staleTime: STATS_QUERY_CONFIG.staleTime,
      });
    } else if (prefetchNational) {
      queryClient.prefetchQuery({
        queryKey: ["mission-locale-stats", "national", currentPeriod],
        queryFn: () => _get(`/api/v1/admin/mission-locale/stats/national`, { params: { period: currentPeriod } }),
        staleTime: STATS_QUERY_CONFIG.staleTime,
      });
    }

    const baseUrl =
      currentView === "national"
        ? "/api/v1/admin/mission-locale/stats/national"
        : "/api/v1/mission-locale/stats/synthese";

    PERIODS.filter((p) => p !== currentPeriod).forEach((period) => {
      queryClient.prefetchQuery({
        queryKey: ["mission-locale-stats", currentView, period],
        queryFn: () => _get(baseUrl, { params: { period } }),
        staleTime: STATS_QUERY_CONFIG.staleTime,
      });
    });
  }, [currentView, currentPeriod, prefetchNational, queryClient]);
}
