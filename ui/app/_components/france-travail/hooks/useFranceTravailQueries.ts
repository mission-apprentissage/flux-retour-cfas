import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import { IArborescenceResponse } from "../types";

export const franceTravailQueryKeys = {
  all: ["france-travail"] as const,
  arborescence: () => [...franceTravailQueryKeys.all, "arborescence"] as const,
  effectifs: (params: Record<string, any>) => [...franceTravailQueryKeys.all, "effectifs", params] as const,
};

const fetchArborescence = async (): Promise<IArborescenceResponse> => {
  return _get("/api/v1/organisation/france-travail/arborescence");
};

export function useArborescence() {
  return useQuery({
    queryKey: franceTravailQueryKeys.arborescence(),
    queryFn: fetchArborescence,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: false,
  });
}
