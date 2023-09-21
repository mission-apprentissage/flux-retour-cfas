import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { _get, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import {
  OrganismesFiltersQuery,
  convertOrganismesFiltersToQuery,
  parseOrganismesFiltersFromQuery,
} from "@/modules/organismes/models/organismes-filters";

// récupère un organisme
export function useOrganisme(organismeId: string | undefined | null) {
  const {
    data: organisme,
    isLoading,
    error,
    refetch,
  } = useQuery<Organisme, any>(["organisme", organismeId], () => _get(`/api/v1/organismes/${organismeId}`), {
    enabled: !!organismeId,
  });

  const endpoint = `/api/v1/organismes/${organismeId}`;

  const { mutateAsync: generateApiKey, isLoading: isGeneratingApiKey } = useMutation(async () => {
    const { apiKey } = await _post(`${endpoint}/api-key`);
    await refetch();
    return apiKey;
  });

  const { mutateAsync: configureERP, isLoading: isConfiguringERP } = useMutation(
    async (dataToUpdate: { erps: string[]; mode_de_transmission?: string; setup_step_courante?: string }) => {
      const response = await _put(`${endpoint}/configure-erp`, dataToUpdate);
      await refetch();
      return response;
    }
  );

  return {
    organisme,
    isLoading,
    error,
    generateApiKey,
    isGeneratingApiKey,
    configureERP,
    isConfiguringERP,
  };
}

// récupère l'organisme lié à l'organisation pour un OF
export function useOrganisationOrganisme(enabled?: boolean) {
  const {
    data: organisme,
    isLoading,
    error,
  } = useQuery<Organisme, any>(["organisation/organisme"], () => _get("/api/v1/organisation/organisme"), {
    enabled: enabled ?? true,
  });

  return {
    organisme,
    isLoading,
    error,
  };
}

// récupère les organismes accessibles (OF, opérateur public, etc)
export function useOrganisationOrganismes() {
  const router = useRouter();

  const { organismesFilters } = useMemo(() => {
    return { organismesFilters: parseOrganismesFiltersFromQuery(router.query as unknown as OrganismesFiltersQuery) };
  }, [JSON.stringify(router.query)]);

  const {
    data: organismes,
    isLoading,
    error,
  } = useQuery<Organisme[], any>(
    ["organisation/organismes", JSON.stringify(organismesFilters)],
    () => _get("/api/v1/organisation/organismes", { params: convertOrganismesFiltersToQuery(organismesFilters) }),
    { enabled: router.isReady }
  );

  console.log("params :>> ", convertOrganismesFiltersToQuery(organismesFilters));

  return {
    organismes,
    isLoading,
    error,
  };
}
