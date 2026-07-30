import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

export const useErp = () => {
  const {
    data: erps,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["erps"],
    queryFn: () => _get("/api/v1/erps"),
  });

  const erpsById = erps
    ? erps.reduce((acc, erp) => {
        acc[erp.unique_id] = erp;
        return acc;
      }, {})
    : [];

  return {
    erps,
    erpsById,
    isLoading,
    error,
    refetch,
  };
};
