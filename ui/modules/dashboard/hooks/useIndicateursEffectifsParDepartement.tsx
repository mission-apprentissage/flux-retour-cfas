import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { IndicateursEffectifs, IndicateursEffectifsAvecDepartement } from "shared";

import { _get } from "@/common/httpClient";
import { DateFilters, convertEffectifsFiltersToQuery } from "@/modules/models/effectifs-filters";

type UseIndicateursEffectifsParDepartement = {
  isLoading: boolean;
  parDepartement: IndicateursEffectifsAvecDepartement[];
  total: IndicateursEffectifs;
};

export function useIndicateursEffectifsParDepartement(
  effectifsFilters: DateFilters,
  enabled: boolean
): UseIndicateursEffectifsParDepartement {
  const { data, isLoading } = useQuery<IndicateursEffectifsAvecDepartement[]>(
    ["indicateurs/effectifs", effectifsFilters.date.toISOString()],
    () =>
      _get("/api/v1/indicateurs/effectifs/par-departement", {
        params: convertEffectifsFiltersToQuery(effectifsFilters),
      }),
    { enabled }
  );

  const total = useMemo(
    () =>
      (data ?? []).reduce(
        (acc, indicateursDepartement) => {
          acc.apprenants += indicateursDepartement.apprenants;
          acc.apprentis += indicateursDepartement.apprentis;
          acc.inscritsSansContrat += indicateursDepartement.inscritsSansContrat;
          acc.abandons += indicateursDepartement.abandons;
          acc.rupturants += indicateursDepartement.rupturants;
          return acc;
        },
        {
          apprenants: 0,
          apprentis: 0,
          inscritsSansContrat: 0,
          abandons: 0,
          rupturants: 0,
        }
      ),
    [data]
  );

  return {
    isLoading,
    parDepartement: data ?? [],
    total,
  };
}
