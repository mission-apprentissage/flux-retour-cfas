import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { _get } from "@/common/httpClient";

export const useOrganismesDuplicatesEffectifs = (organismeId) => {
  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organismeId) {
      prevOrganismeId.current = organismeId;
      // queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organismeId]);

  const { data, isLoading, error } = useQuery<any, any>(
    ["organismesDuplicatesEffectifs", organismeId],
    async () => {
      const duplicates = await _get(`/api/v1/organismes/${organismeId}/duplicates-effectifs`);
      return duplicates;
    },
    { enabled: !!organismeId }
  );

  return {
    organismesDuplicatesEffectifs: data || [],
    isLoading,
    error,
  };
};
