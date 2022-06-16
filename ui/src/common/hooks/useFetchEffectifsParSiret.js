import { useQuery } from "react-query";

import { fetchEffectifsParSiret } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKey";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

const useFetchEffectifsParSiret = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);
  const { data, isLoading, error } = useQuery([QUERY_KEYS.effectifsPar.siret, requestFilters], () =>
    fetchEffectifsParSiret(requestFilters)
  );
  const effectifs = data ? sortAlphabeticallyBy("nom_etablissement", data) : [];

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParSiret;
