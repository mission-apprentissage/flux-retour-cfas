import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { QUERY_KEYS } from "@/common/constants/queryKeys";

const useFetchOrganismeInfo = (cfaUai: string) => {
  const { data, isLoading, error } = useQuery<any, any>(
    [QUERY_KEYS.CFAS, cfaUai],
    () => _get(`/api/v1/organisme/${cfaUai}`),
    {
      enabled: !!cfaUai,
    }
  );

  return { data, loading: isLoading, error };
};

export default useFetchOrganismeInfo;
