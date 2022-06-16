import { useQuery } from "react-query";

import { fetchCfa } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";

const useFetchCfaInfo = (cfaUai) => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.CFAS, cfaUai], () => fetchCfa(cfaUai));

  return { data, loading: isLoading, error };
};

export default useFetchCfaInfo;
