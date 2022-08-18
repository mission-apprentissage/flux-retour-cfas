import { useQuery } from "react-query";

import { fetchEffectifsNational } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";

const useFetchEffectifsNational = () => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIFS_NATIONAL], () => fetchEffectifsNational());

  return { data, loading: isLoading, error };
};

export default useFetchEffectifsNational;
