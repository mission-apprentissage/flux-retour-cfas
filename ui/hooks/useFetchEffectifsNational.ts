import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { mapFiltersToApiFormat } from "@/common/utils/mapFiltersToApiFormat";

const useFetchEffectifsNational = (date) => {
  const requestFilters = mapFiltersToApiFormat({ date });
  const { data, isLoading, error } = useQuery<any, any>(["indicateurs-national", requestFilters], () =>
    _get("/api/indicateurs-national", { params: requestFilters })
  );

  return { data, loading: isLoading, error };
};

export default useFetchEffectifsNational;
