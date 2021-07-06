import { usePostFetch } from "../../../common/hooks/useFetch";
import { omitNullishValues } from "../../../common/utils/omitNullishValues";
import { useFiltersContext } from "../FiltersContext";

const buildSearchRequestBody = (params) => {
  const flattenedFilters = {
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    etablissement_num_region: params.region?.code ?? null,
    etablissement_num_departement: params.departement?.code ?? null,
    formation_cfd: params.formation?.cfd ?? null,
    siret_etablissement: params.cfa?.siret_etablissement ?? null,
    etablissement_reseaux: params.reseau?.nom ?? null,
  };

  return omitNullishValues(flattenedFilters);
};

export const useFetchChiffresCles = ([startDate, endDate]) => {
  const { state: filters } = useFiltersContext();
  return usePostFetch("/api/dashboard/nouveaux-contrats", buildSearchRequestBody({ ...filters, startDate, endDate }));
};
