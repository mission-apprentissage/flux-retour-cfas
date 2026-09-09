import { useQuery } from "@tanstack/react-query";
import type { IErp } from "shared/models";

export type Erp = Omit<IErp, "unique_id"> & { unique_id: string; disabled?: boolean };

import { _get } from "@/common/httpClient";

export const useErp = () => {
  const {
    data: erps,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["erps"],
    queryFn: () => _get<Erp[]>("/api/v1/erps"),
  });

  const erpsById: Record<string, Erp> = erps
    ? erps.reduce<Record<string, Erp>>((acc, erp) => {
        acc[erp.unique_id] = erp;
        return acc;
      }, {})
    : {};

  return {
    erps,
    erpsById,
    isLoading,
    error,
    refetch,
  };
};
