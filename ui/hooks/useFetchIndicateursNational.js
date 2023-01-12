import { useQuery } from "@tanstack/react-query";

import { fetchIndicateursNational } from "../common/api/tableauDeBord";
import { QUERY_KEYS } from "../common/constants/queryKeys";
import { mapFiltersToApiFormat } from "../common/utils/mapFiltersToApiFormat";

const useFetchIndicateursNational = (date) => {
  const requestFilters = mapFiltersToApiFormat({ date });
  const { data, isLoading, error } = useQuery([QUERY_KEYS.INDICATEURS_NATIONAL, requestFilters], () =>
    fetchIndicateursNational(requestFilters)
  );

  return { data, loading: isLoading, error };
};

export default useFetchIndicateursNational;
