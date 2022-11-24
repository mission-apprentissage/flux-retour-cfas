import { useQuery } from "@tanstack/react-query";

import { fetchSearchReseauxCfas } from "../common/api/tableauDeBord";
import { QUERY_KEYS } from "../common/constants/queryKeys";
import { omitNullishValues } from "../common/utils/omitNullishValues";
import useDebounce from "./useDebounce";

export const MINIMUM_CHARS_TO_PERFORM_SEARCH = 3;
const SEARCH_DEBOUNCE_TIME = 300;

const useReseauCfaSearch = (searchTerm) => {
  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_TIME);

  // perform search if user has entered at least 4 chars or none
  const searchEnabled =
    debouncedSearchTerm.length === 0 || debouncedSearchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH;

  const requestFilters = omitNullishValues({
    // we'll send null if debouncedSearchTerm is ""
    searchTerm: debouncedSearchTerm || null,
  });

  const { data, isLoading } = useQuery(
    [QUERY_KEYS.SEARCH_RESEAUX_CFA, requestFilters],
    () => fetchSearchReseauxCfas(requestFilters),
    {
      enabled: searchEnabled,
    }
  );

  return {
    data: data?.map(({ id, uai, nom_etablissement, nom_reseau, siret }) => {
      return { id, uai, nom_etablissement, nom_reseau, siret };
    }),
    loading: isLoading,
  };
};

export default useReseauCfaSearch;
