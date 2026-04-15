import { useMutation, useQueryClient } from "@tanstack/react-query";

import { _post } from "@/common/httpClient";

import { cfaQueryKeys } from "./useCfaQueries";

interface DeclareCfaRuptureParams {
  organismeId: string;
  effectifId: string;
  dateRupture: string;
  source: string;
}

const declareCfaRupture = async ({ organismeId, effectifId, dateRupture, source }: DeclareCfaRuptureParams) => {
  return _post(`/api/v1/organismes/${organismeId}/cfa/effectif/${effectifId}/declare-rupture`, {
    date_rupture: new Date(dateRupture).toISOString(),
    source,
  });
};

export function useDeclareCfaRupture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declareCfaRupture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cfaQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ["effectif"] });
    },
  });
}
