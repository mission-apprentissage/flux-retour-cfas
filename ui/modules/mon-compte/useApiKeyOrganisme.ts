import { useMutation, useQuery } from "@tanstack/react-query";

import { _post, _get, _postFile } from "@/common/httpClient";

export function useOrganismeApiKey(organismeId: string | undefined | null) {
  const endpoint = `/api/v1/organismes/${organismeId}/api-key`;

  const { isLoading, data, refetch } = useQuery({
    enabled: !!organismeId,
    queryKey: ["api-key", organismeId],
    queryFn: async () => _get<string>(endpoint),
  });

  const { mutateAsync: generateApiKey } = useMutation(async () => {
    const apiKey = await _post(endpoint);
    await refetch();
    return apiKey;
  });

  return {
    isLoading,
    data,
    generateApiKey,
  };
}
