import { useQuery } from "react-query";

import { fetchEffectifsParCfa } from "../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

const useFetchEffectifsParCfa = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);

  const { data, isLoading, error } = useQuery(["effectifs-par-cfa", requestFilters], () =>
    fetchEffectifsParCfa(requestFilters)
  );

  const effectifs = sortAlphabeticallyBy("nom_etablissement", data || []);

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParCfa;
