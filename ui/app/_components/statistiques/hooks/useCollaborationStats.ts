import { useQuery } from "@tanstack/react-query";
import type { ICollaborationStatsResponseSchema } from "shared/models/routes/admin/collaboration-stats.api";

import { _get } from "@/common/httpClient";

import { STATS_QUERY_CONFIG } from "./useStatsQueries";

export type ICollaborationStatsResponse = ICollaborationStatsResponseSchema;

export function useCollaborationStats() {
  return useQuery<ICollaborationStatsResponse>({
    queryKey: ["admin", "collaborations", "stats"],
    queryFn: () => _get<ICollaborationStatsResponse>("/api/v1/admin/collaborations/stats"),
    ...STATS_QUERY_CONFIG,
  });
}
