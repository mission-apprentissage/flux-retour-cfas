import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";

const useFetchEffectifsParNiveauFormation = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);
  const { data, isLoading, error } = useQuery(["/api/indicateurs/niveau-formation", requestFilters], () =>
    _get("/api/indicateurs/niveau-formation", { params: requestFilters })
  );

  const repartitionEffectifs = data?.map((repartition) => {
    return {
      niveauFormation: repartition.niveau_formation,
      niveauFormationLibelle: repartition.niveau_formation_libelle,
      effectifs: repartition.effectifs,
    };
  });

  return { data: repartitionEffectifs, loading: isLoading, error };
};

export default useFetchEffectifsParNiveauFormation;
