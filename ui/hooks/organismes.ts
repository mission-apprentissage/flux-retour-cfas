import { useMutation, useQuery } from "@tanstack/react-query";

import { _get, _post, _put } from "@/common/httpClient";
import { omitNullishValues } from "@/common/utils/omitNullishValues";
import { useSimpleFiltersContext } from "@/modules/mon-espace/landing/common/SimpleFiltersContext";

// récupère un organisme
export function useOrganisme(organismeId: string | undefined | null) {
  const {
    data: organisme,
    isLoading,
    error,
    refetch,
  } = useQuery<any, any>(["organisme", organismeId], () => _get(`/api/v1/organismes/${organismeId}`), {
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
export function useOrganisationOrganisme() {
  const {
    data: organisme,
    isLoading,
    error,
  } = useQuery<any, any>(["organisation/organisme"], () => _get("/api/v1/organisation/organisme"), {});

  return {
    organisme,
    isLoading,
    error,
  };
}

// récupère les organismes accessibles (OF, opérateur public, etc)
export function useOrganisationOrganismes() {
  const {
    data: organismes,
    isLoading,
    error,
  } = useQuery<any, any>(["organisation/organismes"], () => _get("/api/v1/organisation/organismes"), {});

  return {
    organismes,
    isLoading,
    error,
  };
}

function mapSimpleFiltersToApiFormat(filtersValues) {
  return omitNullishValues({
    date: filtersValues?.date.toISOString(),
    etablissement_num_departement: filtersValues?.departement?.code,
    etablissement_num_region: filtersValues?.region?.code,
  });
}

export function useFetchOrganismeIndicateurs(organismeId: string) {
  const { filtersValues } = useSimpleFiltersContext();
  const requestFilters = mapSimpleFiltersToApiFormat(filtersValues);

  const {
    data: indicateurs,
    isLoading,
    error,
  } = useQuery<any, any>(["organismes", organismeId, "indicateurs", requestFilters], () =>
    _get(`/api/v1/organismes/${organismeId}/indicateurs`, { params: requestFilters })
  );

  return { indicateurs, isLoading, error };
}
