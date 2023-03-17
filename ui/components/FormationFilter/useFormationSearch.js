import { useQuery } from "@tanstack/react-query";

import useDebounce from "@/hooks/useDebounce";
import { omitNullishValues } from "@/common/utils/omitNullishValues";
import { _post } from "@/common/httpClient";

export const MINIMUM_CHARS_TO_PERFORM_SEARCH = 3;
const SEARCH_DEBOUNCE_TIME = 300;

const useFormationSearch = (searchTerm, filters) => {
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
    ["search-formations", requestFilters],
    () => _post("/api/formations/search", requestFilters),
    {
      enabled: searchEnabled,
    }
  );

  return { data, loading: isLoading };
};

export default useFormationSearch;
