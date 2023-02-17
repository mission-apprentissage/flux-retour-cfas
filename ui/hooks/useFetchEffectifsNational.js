import { useQuery } from "@tanstack/react-query";

import { fetchEffectifsNational } from "@/common/api/tableauDeBord";
import { QUERY_KEYS } from "@/common/constants/queryKeys";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";

const useFetchEffectifsNational = (date) => {
  const requestFilters = mapFiltersToApiFormat({ date });
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIFS_NATIONAL, requestFilters], () =>
    fetchEffectifsNational(requestFilters)
  );

  return { data, loading: isLoading, error };
};

export default useFetchEffectifsNational;
