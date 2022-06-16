import { useQuery } from "react-query";

import { fetchCfa } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKey";

const useFetchCfaInfo = (cfaUai) => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.cfas, cfaUai], () => fetchCfa(cfaUai));

  return { data, loading: isLoading, error };
};

export default useFetchCfaInfo;
