import { _get } from "../common/httpClient";
import { useQuery } from "@tanstack/react-query";

export function useOrganisationOrganisme() {
  const {
    data: organisme,
    isLoading,
    error,
  } = useQuery(["organisation/organisme"], () => _get("/api/v1/organisation/organisme"), {});

  return {
    organisme,
    isLoading,
    error,
  };
}
