import { useQuery } from "@tanstack/react-query";

import { fetchSearchCfas } from "../../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../../common/constants/queryKeys";
import useDebounce from "../../../../hooks/useDebounce";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";

export const MINIMUM_CHARS_TO_PERFORM_SEARCH = 4;
const SEARCH_DEBOUNCE_TIME = 300;

const useCfaSearch = (searchTerm, filters) => {
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_TIME);

  // perform search if user has entered at least 4 chars or none
  const searchEnabled =
    debouncedSearchTerm.length === 0 || debouncedSearchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH;

  const requestFilters = omitNullishValues({
    // we'll send null if debouncedSearchTerm is ""
    searchTerm: debouncedSearchTerm || null,
    etablissement_num_region: filters.region?.code ?? null,
    etablissement_num_departement: filters.departement?.code ?? null,
    etablissement_reseaux: filters.reseau?.nom ?? null,
  });

  const { data, isLoading } = useQuery(
    [QUERY_KEYS.SEARCH_CFAS, requestFilters],
    () => fetchSearchCfas(requestFilters),
    {
      enabled: searchEnabled,
    }
  );

  return {
    data: data?.map(({ uai, nom, departement, nature, sirets }) => {
      return { uai_etablissement: uai, nom_etablissement: nom, departement, nature, sirets_etablissement: sirets };
    }),
    loading: isLoading,
  };
};

export default useCfaSearch;
