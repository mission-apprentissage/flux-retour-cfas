"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { _get } from "@/common/httpClient";

import { STATS_QUERY_CONFIG } from "../config";
import type { Period } from "../ui/PeriodSelector";

const PERIODS: Period[] = ["30days", "3months", "all"];

type StatsView = "synthese" | "national";

const VIEW_URLS: Record<StatsView, string> = {
  synthese: "/api/v1/mission-locale/stats/synthese",
  national: "/api/v1/admin/mission-locale/stats/national",
};

export function useStatsPrefetch(currentView: StatsView, currentPeriod: Period) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchWithErrorHandling = async (queryKey: string[], queryFn: () => Promise<unknown>) => {
      try {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: STATS_QUERY_CONFIG.staleTime,
        });
      } catch (error) {
        console.error(`[useStatsPrefetch] Failed to prefetch ${queryKey.join("/")}:`, error);
      }
    };

    if (currentView === "national") {
      prefetchWithErrorHandling(["mission-locale-stats", "synthese", currentPeriod], () =>
        _get(`/api/v1/mission-locale/stats/synthese`, { params: { period: currentPeriod } })
      );
    }

    const baseUrl = VIEW_URLS[currentView];

    PERIODS.filter((p) => p !== currentPeriod).forEach((period) => {
      prefetchWithErrorHandling(["mission-locale-stats", currentView, period], () =>
        _get(baseUrl, { params: { period } })
      );
    });
  }, [currentView, currentPeriod, queryClient]);
}
