import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IUpdateMissionLocaleEffectif } from "shared";

import { _get, _post } from "@/common/httpClient";

export const effectifQueryKeys = {
  all: ["effectifs"] as const,
  detail: (id: string) => [...effectifQueryKeys.all, "detail", id] as const,
  list: (params: Record<string, any>) => [...effectifQueryKeys.all, "list", params] as const,
};

const fetchEffectifDetails = async (effectifId: string) => {
  return _get(`/api/mission-locale/effectif/${effectifId}`);
};

const updateEffectif = async ({ effectifId, data }: { effectifId: string; data: IUpdateMissionLocaleEffectif }) => {
  return _post(`/api/v1/organisation/mission-locale/effectif/${effectifId}`, data);
};

export function useEffectifDetails(effectifId: string, enabled = true) {
  return useQuery({
    queryKey: effectifQueryKeys.detail(effectifId),
    queryFn: () => fetchEffectifDetails(effectifId),
    enabled: enabled && !!effectifId,
  });
}

export function useUpdateEffectif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEffectif,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.detail(variables.effectifId) });
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.all });
    },
  });
}
