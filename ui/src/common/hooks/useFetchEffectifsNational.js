import { useQuery } from "react-query";

import { fetchEffectifsNational } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";

const useFetchEffectifsNational = (date) => {
  const requestFilters = { date };
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIFS_NATIONAL, requestFilters], () =>
    fetchEffectifsNational(requestFilters)
  );

  return { data, loading: isLoading, error };
};

export default useFetchEffectifsNational;
