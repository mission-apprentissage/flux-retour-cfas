import { useQuery } from "react-query";

import { fetchCfa } from "../common/api/tableauDeBord";
import { QUERY_KEYS } from "../common/constants/queryKeys";

const useFetchCfaInfo = (cfaUai) => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.CFAS, cfaUai], () => fetchCfa(cfaUai), {
    enabled: Boolean(cfaUai),
  });

  return { data, loading: isLoading, error };
};

export default useFetchCfaInfo;
