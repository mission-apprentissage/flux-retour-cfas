import { useQuery } from "react-query";

import { fetchEffectifsParNiveauFormation } from "../../common/api/tableauDeBord";
import { QUERY_KEY } from "../constants/queryKey";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";

const useFetchEffectifsParNiveauFormation = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);
  const { data, isLoading, error } = useQuery([QUERY_KEY.effectifsPar.niveauFormation, requestFilters], () =>
    fetchEffectifsParNiveauFormation(requestFilters)
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
