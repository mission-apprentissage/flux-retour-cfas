import { _get } from "../common/httpClient";
import { useQuery } from "@tanstack/react-query";

export function useOrganisme(organismeId: string) {
  const {
    data: organisme,
    isLoading,
    error,
  } = useQuery(["organisme", organismeId], () => _get(`/api/v1/organismes/${organismeId}`), {
    enabled: !!organismeId,
  });

  return {
    organisme,
    isLoading,
    error,
  };
}
