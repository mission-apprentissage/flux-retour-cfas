import { useQuery } from "react-query";

import { fetchCfa } from "../api/tableauDeBord";

const useFetchCfaInfo = (cfaUai) => {
  const { data, isLoading, error } = useQuery(["cfas", cfaUai], () => fetchCfa(cfaUai));

  return { data, loading: isLoading, error };
};

export default useFetchCfaInfo;
