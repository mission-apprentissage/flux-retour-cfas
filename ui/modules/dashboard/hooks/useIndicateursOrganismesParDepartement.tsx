import { useQuery } from "@tanstack/react-query";
import { IndicateursOrganismesAvecDepartement } from "shared";

import { _get } from "@/common/httpClient";

type UsePublicIndicateursCoverage = {
  data: IndicateursOrganismesAvecDepartement[];
  isLoading: boolean;
};

export function useIndicateursOrganismesParDepartement(dateFilter: Date | null): UsePublicIndicateursCoverage {
  const params = dateFilter ? { date: dateFilter } : {};

  const { data, isLoading } = useQuery<IndicateursOrganismesAvecDepartement[]>(
    ["indicateurs/organismes/par-departement", dateFilter?.toISOString()],
    () => _get("/api/v1/indicateurs/organismes/par-departement", { params })
  );

  return {
    data: data ?? [],
    isLoading,
  };
}
