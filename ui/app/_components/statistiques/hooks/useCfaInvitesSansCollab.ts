import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  ICfaInvitesSansCollabQuery,
  ICfaInvitesSansCollabResponse,
} from "shared/models/routes/admin/cfa-invites-sans-collab.api";

import { _get } from "@/common/httpClient";

import { STATS_QUERY_CONFIG } from "./useStatsQueries";

export function useCfaInvitesSansCollab(params: ICfaInvitesSansCollabQuery) {
  return useQuery<ICfaInvitesSansCollabResponse>({
    queryKey: ["admin", "collaborations", "cfa-invites", params],
    queryFn: () =>
      _get<ICfaInvitesSansCollabResponse>("/api/v1/admin/collaborations/cfa-invites-sans-collab", { params }),
    ...STATS_QUERY_CONFIG,
    placeholderData: keepPreviousData,
  });
}
