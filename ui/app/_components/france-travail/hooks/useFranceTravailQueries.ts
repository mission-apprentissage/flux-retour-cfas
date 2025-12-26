import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { _get, _put } from "@/common/httpClient";

import {
  FranceTravailSituation,
  IArborescenceResponse,
  IDepartementCountsResponse,
  IEffectifDetailResponse,
  IEffectifsBySecteurResponse,
  IEffectifsTraitesParMoisResponse,
  IMoisTraitesResponse,
} from "../types";

export const franceTravailQueryKeys = {
  all: ["france-travail"] as const,
  arborescence: () => [...franceTravailQueryKeys.all, "arborescence"] as const,
  effectifsBySecteur: (codeSecteur: number, params: Record<string, any>) =>
    [...franceTravailQueryKeys.all, "effectifs", "secteur", codeSecteur, params] as const,
  effectifDetail: (id: string, params: Record<string, any>) =>
    [...franceTravailQueryKeys.all, "effectif", id, params] as const,
  moisTraites: () => [...franceTravailQueryKeys.all, "mois-traites"] as const,
  effectifsTraitesParMois: (mois: string, params: Record<string, any>) =>
    [...franceTravailQueryKeys.all, "effectifs", "traites", "mois", mois, params] as const,
  departementCounts: (codeSecteur: number) =>
    [...franceTravailQueryKeys.all, "departement-counts", codeSecteur] as const,
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
  params: { page?: number; limit?: number; search?: string; departements?: string } = {}
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

const fetchEffectifDetail = async (
  id: string,
  params: {
    nom_liste: "a_traiter" | "traite";
    code_secteur?: number;
    search?: string;
    sort?: string;
    order?: string;
    mois?: string;
    departements?: string;
  }
): Promise<IEffectifDetailResponse> => {
  return _get(`/api/v1/organisation/france-travail/effectif/${id}`, { params });
};

export function useEffectifDetail(
  id: string | null,
  params: {
    nom_liste: "a_traiter" | "traite";
    code_secteur?: number;
    search?: string;
    sort?: string;
    order?: string;
    mois?: string;
    departements?: string;
  }
) {
  const queryClient = useQueryClient();

  const query = useQuery(franceTravailQueryKeys.effectifDetail(id!, params), () => fetchEffectifDetail(id!, params), {
    enabled: id !== null,
    staleTime: 30 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (data.next) {
        queryClient.prefetchQuery(
          franceTravailQueryKeys.effectifDetail(data.next.id, params),
          () => fetchEffectifDetail(data.next!.id, params),
          {
            staleTime: 30 * 1000,
          }
        );
      }

      if (data.previous) {
        queryClient.prefetchQuery(
          franceTravailQueryKeys.effectifDetail(data.previous.id, params),
          () => fetchEffectifDetail(data.previous!.id, params),
          {
            staleTime: 30 * 1000,
          }
        );
      }
    },
  });

  return query;
}

interface UpdateEffectifParams {
  id: string;
  commentaire: string | null;
  situation: FranceTravailSituation;
  code_secteur: number;
}

const updateEffectif = async ({ id, commentaire, situation, code_secteur }: UpdateEffectifParams): Promise<void> => {
  return _put(`/api/v1/organisation/france-travail/effectif/${id}`, { commentaire, situation, code_secteur });
};

export function useUpdateEffectif() {
  const queryClient = useQueryClient();

  return useMutation(updateEffectif, {
    onSuccess: () => {
      queryClient.invalidateQueries(franceTravailQueryKeys.all);
    },
  });
}

const fetchMoisTraites = async (): Promise<IMoisTraitesResponse> => {
  return _get("/api/v1/organisation/france-travail/effectifs/traite/mois");
};

export function useMoisTraites() {
  return useQuery(franceTravailQueryKeys.moisTraites(), fetchMoisTraites, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

const fetchEffectifsTraitesParMois = async (
  mois: string,
  params: Record<string, any>
): Promise<IEffectifsTraitesParMoisResponse> => {
  return _get(`/api/v1/organisation/france-travail/effectifs/traite/mois/${mois}`, { params });
};

export function useEffectifsTraitesParMois(
  mois: string | null,
  params: { page?: number; limit?: number; search?: string; departements?: string } = {}
) {
  return useQuery(
    franceTravailQueryKeys.effectifsTraitesParMois(mois!, params),
    () => fetchEffectifsTraitesParMois(mois!, params),
    {
      enabled: mois !== null,
      staleTime: 30 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );
}

const fetchDepartementCounts = async (codeSecteur: number): Promise<IDepartementCountsResponse> => {
  return _get(`/api/v1/organisation/france-travail/departement-counts/${codeSecteur}`);
};

export function useDepartementCounts(codeSecteur: number | null) {
  return useQuery(franceTravailQueryKeys.departementCounts(codeSecteur!), () => fetchDepartementCounts(codeSecteur!), {
    enabled: codeSecteur !== null,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });
}
