import { useQuery } from "react-query";

import { fetchCfa } from "../api/tableauDeBord";
import { QUERY_KEY } from "../constants/queryKey";

const useFetchCfaInfo = (cfaUai) => {
  const { data, isLoading, error } = useQuery([QUERY_KEY.cfas, cfaUai], () => fetchCfa(cfaUai));

  return { data, loading: isLoading, error };
};

export default useFetchCfaInfo;
