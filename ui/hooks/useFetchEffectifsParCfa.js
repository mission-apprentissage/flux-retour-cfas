import { useQuery } from "@tanstack/react-query";

import { fetchEffectifsParCfa } from "@/common/api/tableauDeBord";
import { QUERY_KEYS } from "@/common/constants/queryKeys";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";
import { sortAlphabeticallyBy } from "@/common/utils/sortAlphabetically";

const useFetchEffectifsParCfa = (filters = {}) => {
  const requestFilters = mapFiltersToApiFormat(filters);

  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIF_PAR.CFA, requestFilters], () =>
    fetchEffectifsParCfa(requestFilters)
  );

  const effectifs = data ? sortAlphabeticallyBy("nom_etablissement", data) : [];

  return { data: effectifs, loading: isLoading, error };
};

export default useFetchEffectifsParCfa;
