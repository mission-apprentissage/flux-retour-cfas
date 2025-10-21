import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import { IArborescenceResponse, IEffectifsBySecteurResponse } from "../types";

export const franceTravailQueryKeys = {
  all: ["france-travail"] as const,
  arborescence: () => [...franceTravailQueryKeys.all, "arborescence"] as const,
  effectifsBySecteur: (codeSecteur: number, params: Record<string, any>) =>
    [...franceTravailQueryKeys.all, "effectifs", "secteur", codeSecteur, params] as const,
};

const fetchArborescence = async (): Promise<IArborescenceResponse> => {
  return _get("/api/v1/organisation/france-travail/arborescence");
};

const fetchEffectifsBySecteur = async (
  codeSecteur: number,
  params: Record<string, any>
): Promise<IEffectifsBySecteurResponse> => {
  return _get(`/api/v1/organisation/france-travail/effectifs/a-traiter/${codeSecteur}`, { params });
};

export function useArborescence() {
  return useQuery(franceTravailQueryKeys.arborescence(), fetchArborescence, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useEffectifsBySecteur(
  codeSecteur: number | null,
  params: { page?: number; limit?: number; search?: string } = {}
) {
  return useQuery(
    franceTravailQueryKeys.effectifsBySecteur(codeSecteur!, params),
    () => fetchEffectifsBySecteur(codeSecteur!, params),
    {
      enabled: codeSecteur !== null,
      staleTime: 30 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );
}
