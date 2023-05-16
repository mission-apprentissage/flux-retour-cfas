import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { sortByNormalizedLabels } from "@/common/utils/array";

type TData = {
  inputKeys: { label: string; value: string }[];
  outputKeys: { label: string; value: string }[];
  requireKeys: { label: string; value: string }[];
};

const useUploadAnalyser = (organismeId: string) => {
  const { status, data, error } = useQuery(["upload/analyse", organismeId], () =>
    _get<TData>(`/api/v1/organismes/${organismeId}/upload/analyse`)
  );

  const loading = status === "loading";

  const currentAvailableKeys = {
    in: data ? sortByNormalizedLabels(Object.values(data?.inputKeys).map((o) => ({ ...o, locked: false }))) : [],
    out: data ? sortByNormalizedLabels(Object.values(data?.outputKeys).map((o) => ({ ...o, locked: false }))) : [],
  };

  return { data, loading, error };
};

export default useUploadAnalyser;
