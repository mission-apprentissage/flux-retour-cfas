import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import type { ICfaEffectifsResponse, ICfaRupturesResponse } from "@/common/types/cfaRuptures";

interface CfaEffectifsParams {
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: "asc" | "desc";
  en_rupture?: string;
  collab_status?: string;
  formation?: string;
}

export const cfaQueryKeys = {
  all: ["cfa"] as const,
  ruptures: (organismeId: string) => [...cfaQueryKeys.all, "effectifs-ruptures", organismeId] as const,
  effectifs: (organismeId: string, params: CfaEffectifsParams) =>
    [...cfaQueryKeys.all, "effectifs", organismeId, params] as const,
};

export function useCfaEffectifsRuptures(organismeId: string | undefined) {
  return useQuery<ICfaRupturesResponse>({
    queryKey: cfaQueryKeys.ruptures(organismeId!),
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/cfa/effectifs-ruptures`),
    enabled: !!organismeId,
    useErrorBoundary: true,
  });
}

export function useCfaEffectifs(organismeId: string | undefined, params: CfaEffectifsParams) {
  const { page, limit, sort, order, search, en_rupture, collab_status, formation } = params;

  return useQuery<ICfaEffectifsResponse>({
    queryKey: cfaQueryKeys.effectifs(organismeId!, params),
    queryFn: () => {
      const queryParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sort,
        order,
      };
      if (search) queryParams.search = search;
      if (en_rupture) queryParams.en_rupture = en_rupture;
      if (collab_status) queryParams.collab_status = collab_status;
      if (formation) queryParams.formation = formation;

      return _get(`/api/v1/organismes/${organismeId}/cfa/effectifs`, { params: queryParams });
    },
    enabled: !!organismeId,
    keepPreviousData: true,
    useErrorBoundary: true,
  });
}
