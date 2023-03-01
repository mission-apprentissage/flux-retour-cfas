import { useQuery } from "@tanstack/react-query";

import { fetchOrganismeByUai } from "@/common/api/tableauDeBord";
import { QUERY_KEYS } from "@/common/constants/queryKeys";

const useFetchOrganismeInfo = (cfaUai) => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.CFAS, cfaUai], () => fetchOrganismeByUai(cfaUai), {
    enabled: !!cfaUai,
  });

  return { data, loading: isLoading, error };
};

export default useFetchOrganismeInfo;
