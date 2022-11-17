import { useQuery } from "react-query";

import { fetchEffectifsParCfa } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

const useFetchEffectifsParCfa = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);

  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIF_PAR.CFA, requestFilters], () =>
    fetchEffectifsParCfa(requestFilters)
  );

  const effectifs = data ? sortAlphabeticallyBy("nom_etablissement", data) : [];

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParCfa;
