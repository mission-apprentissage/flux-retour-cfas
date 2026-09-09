import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { _get, _post, _put } from "@/common/httpClient";

export const effectifQueryKeys = {
  all: ["effectifs"] as const,
  detail: (id: string) => [...effectifQueryKeys.all, "detail", id] as const,
  list: (params: Record<string, any>) => [...effectifQueryKeys.all, "list", params] as const,
  bannerStats: () => ["ml-banner-stats"] as const,
  mlParametres: () => ["ml-parametres"] as const,
};

export function useMlParametres() {
  return useQuery<{ rdv_url: string | null }>({
    queryKey: effectifQueryKeys.mlParametres(),
    queryFn: () => _get(`/api/v1/organisation/mission-locale/parametres`),
  });
}

export function useUpdateMlParametres() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rdv_url: string | null }) => _put(`/api/v1/organisation/mission-locale/parametres`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.mlParametres() });
    },
  });
}

/**
 * Compteur léger pour la bannière "Souhaite un RDV" en haut de la page d'accueil ML.
 */
export function useMlBannerStats() {
  return useQuery<{ souhaite_rdv_count: number }>({
    queryKey: effectifQueryKeys.bannerStats(),
    queryFn: () => _get(`/api/v1/organisation/mission-locale/banner-stats`),
    staleTime: 30 * 1000,
  });
}
