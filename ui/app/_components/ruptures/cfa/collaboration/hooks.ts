"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";

import { useAuth } from "@/app/_context/UserContext";
import { _get, _put } from "@/common/httpClient";

export function useCfaEffectifDetail(id: string) {
  const { user } = useAuth();

  return useQuery(
    ["effectif", id],
    async () => {
      if (!id) return null;
      return await _get<IEffectifMissionLocale>(
        `/api/v1/organismes/${user?.organisation?.organisme_id}/cfa/effectif/${id}`
      );
    },
    {
      enabled: !!id,
      suspense: true,
      useErrorBoundary: true,
    }
  );
}

export function useStartCollaboration(effectifId: string, onSuccess: () => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const organismeId = user?.organisation?.organisme_id;
      return _put(`/api/v1/organismes/${organismeId}/mission-locale/effectif/${effectifId}`, {
        rupture: true,
        acc_conjoint: true,
        motif: [] as ACC_CONJOINT_MOTIF_ENUM[],
        commentaires: "",
      });
    },
    onSuccess: () => {
      onSuccess();
      queryClient.invalidateQueries(["effectif"]);
    },
  });
}
