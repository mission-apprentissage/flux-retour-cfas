"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { API_EFFECTIF_LISTE, IEffectifMissionLocale, IUpdateMissionLocaleEffectif } from "shared";

import { _get, _post } from "@/common/httpClient";

export function useMlUpdateEffectif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ effectifId, data }: { effectifId: string; data: IUpdateMissionLocaleEffectif }) =>
      _post(`/api/v1/organisation/mission-locale/effectif/${effectifId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["effectif", variables.effectifId]);
      queryClient.invalidateQueries(["effectifs"]);
    },
  });
}

export function useMlEffectifDetail(id: string) {
  const searchParams = useSearchParams();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;

  return useQuery(
    ["effectif", id, nomListe],
    async () => {
      if (!id) return null;
      return await _get<IEffectifMissionLocale>(`/api/v1/organisation/mission-locale/effectif/${id}`, {
        params: {
          nom_liste: nomListe,
        },
      });
    },
    {
      enabled: !!id,
      suspense: true,
      useErrorBoundary: true,
    }
  );
}
