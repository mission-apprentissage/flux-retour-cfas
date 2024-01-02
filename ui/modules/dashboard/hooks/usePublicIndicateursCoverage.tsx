import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { IndicateursOrganismesAvecDepartement } from "@/modules/models/indicateurs";

type UsePublicIndicateursCoverage = {
  data: IndicateursOrganismesAvecDepartement[];
  isLoading: boolean;
};

export function usePublicIndicateursCoverage(): UsePublicIndicateursCoverage {
  const { data, isLoading } = useQuery<IndicateursOrganismesAvecDepartement[]>(
    ["indicateurs/organismes/par-departement"],
    () => _get("/api/v1/indicateurs/organismes/par-departement")
  );

  return {
    data: data ?? [],
    isLoading,
  };
}
