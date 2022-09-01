import { useQuery } from "react-query";

import { fetchEffectifsNational } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";

const useFetchEffectifsNational = (date) => {
  const requestFilters = mapFiltersToApiFormat({ date });
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIFS_NATIONAL, requestFilters], () =>
    fetchEffectifsNational(requestFilters)
  );

  return { data, loading: isLoading, error };
};

export default useFetchEffectifsNational;
