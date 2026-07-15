import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import type {
  ICfaEffectifsResponse,
  ICfaRupturesResponse,
  ICfaSuiviMissionLocaleResponse,
} from "@/common/types/cfaRuptures";

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

interface CfaRupturesParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  collab_status?: string;
  formation?: string;
}

interface CfaSuiviParams {
  category: string;
  page: number;
  limit: number;
  search?: string;
  sort: string;
  order: "asc" | "desc";
  collab_status?: string;
  formation?: string;
}

export const cfaQueryKeys = {
  all: ["cfa"] as const,
  ruptures: (organismeId: string, params: CfaRupturesParams) =>
    [...cfaQueryKeys.all, "effectifs-ruptures", organismeId, params] as const,
  effectifs: (organismeId: string, params: CfaEffectifsParams) =>
    [...cfaQueryKeys.all, "effectifs", organismeId, params] as const,
  suivi: (organismeId: string, params: CfaSuiviParams) =>
    [...cfaQueryKeys.all, "suivi-mission-locale", organismeId, params] as const,
  unreadNotificationsCount: (organismeId: string) =>
    [...cfaQueryKeys.all, "unread-notifications-count", organismeId] as const,
};

export function useCfaEffectifsRuptures(organismeId: string | undefined, params: CfaRupturesParams) {
  const { page, limit, sort, order, collab_status, formation } = params;
  return useQuery<ICfaRupturesResponse>({
    queryKey: cfaQueryKeys.ruptures(organismeId!, params),
    queryFn: () => {
      const queryParams: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sort,
        order,
      };
      if (collab_status) queryParams.collab_status = collab_status;
      if (formation) queryParams.formation = formation;
      return _get(`/api/v1/organismes/${organismeId}/cfa/effectifs-ruptures`, { params: queryParams });
    },
    enabled: !!organismeId,
    keepPreviousData: true,
    useErrorBoundary: true,
  });
}

export function useCfaSuiviMissionLocale(organismeId: string | undefined, params: CfaSuiviParams) {
  const { category, page, limit, search, sort, order, collab_status, formation } = params;
  return useQuery<ICfaSuiviMissionLocaleResponse>({
    queryKey: cfaQueryKeys.suivi(organismeId!, params),
    queryFn: () => {
      const queryParams: Record<string, string> = {
        category,
        page: String(page),
        limit: String(limit),
        sort,
        order,
      };
      if (search) queryParams.search = search;
      if (collab_status) queryParams.collab_status = collab_status;
      if (formation) queryParams.formation = formation;
      return _get(`/api/v1/organismes/${organismeId}/cfa/suivi-mission-locale`, { params: queryParams });
    },
    enabled: !!organismeId,
    keepPreviousData: true,
    useErrorBoundary: true,
  });
}

// Re-exported from shared hook to maintain backwards compatibility
export { useCfaUnreadNotificationsCount } from "@/hooks/useCfaUnreadNotifications";

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
