import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { QUERY_KEYS } from "@/common/constants/queryKeys";

const useFetchFormationInfo = (formationCfd) => {
  const { data, isLoading, error } = useQuery<any, any>([QUERY_KEYS.FORMATION, formationCfd], () =>
    _get(`/api/formations/${formationCfd}`)
  );

  return { data, loading: isLoading, error };
};

export default useFetchFormationInfo;
