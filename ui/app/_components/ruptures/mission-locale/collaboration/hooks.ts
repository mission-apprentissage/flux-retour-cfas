"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { API_EFFECTIF_LISTE, IEffectifMissionLocale, IUpdateMissionLocaleEffectif } from "shared";

import { _get, _post } from "@/common/httpClient";

import { effectifQueryKeys } from "../../shared/hooks";

export function useMlUpdateEffectif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ effectifId, data }: { effectifId: string; data: IUpdateMissionLocaleEffectif }) =>
      _post(`/api/v1/organisation/mission-locale/effectif/${effectifId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.detail(variables.effectifId) });
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.all });
    },
  });
}

export function useMlEffectifDetail(id: string) {
  const searchParams = useSearchParams();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;
  // Filtre villes transmis pour que le backend calcule précédent/suivant sur le sous-ensemble filtré.
  const codePostal = searchParams?.get("cp") || undefined;

  return useQuery(
    [...effectifQueryKeys.detail(id), nomListe, codePostal],
    async () => {
      if (!id) return null;
      return await _get<IEffectifMissionLocale>(`/api/v1/organisation/mission-locale/effectif/${id}`, {
        params: {
          nom_liste: nomListe,
          ...(codePostal ? { code_postal: codePostal } : {}),
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
