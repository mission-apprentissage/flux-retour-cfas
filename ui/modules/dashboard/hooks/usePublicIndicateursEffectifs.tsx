import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import { EffectifsFilters, convertEffectifsFiltersToQuery } from "@/modules/models/effectifs-filters";
import { IndicateursEffectifs, IndicateursEffectifsAvecDepartement } from "@/modules/models/indicateurs";

type UsePublicIndicateurs = {
  isLoading: boolean;
  parDepartement: IndicateursEffectifsAvecDepartement[];
  national: IndicateursEffectifs;
};

export function usePublicIndicateursEffectifs(
  effectifsFilters: Partial<EffectifsFilters> & Pick<EffectifsFilters, "date">,
  enabled: boolean
): UsePublicIndicateurs {
  const { date, ...rest } = effectifsFilters;
  const { data, isLoading } = useQuery<IndicateursEffectifsAvecDepartement[]>(
    ["indicateurs/effectifs", JSON.stringify({ date: effectifsFilters.date.toISOString(), rest })],
    () =>
      _get("/api/v1/indicateurs/effectifs/par-departement", {
        params: convertEffectifsFiltersToQuery(effectifsFilters),
      }),
    { enabled }
  );

  const national = useMemo(
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
    national,
  };
}
