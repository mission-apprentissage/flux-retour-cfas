import { useQuery } from "react-query";

import { fetchSearchReseauxCfas } from "../api/tableauDeBord";
import { omitNullishValues } from "../utils/omitNullishValues";
import useDebounce from "./useDebounce";

export const MINIMUM_CHARS_TO_PERFORM_SEARCH = 4;
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
    ["search-reseaux-cfas", requestFilters],
    () => fetchSearchReseauxCfas(requestFilters),
    {
      enabled: searchEnabled,
    }
  );

  return {
    data: data?.map(({ id, uai, nom_etablissement, nom_reseau }) => {
      return { id, uai, nom_etablissement, nom_reseau };
    }),
    loading: isLoading,
  };
};

export default useReseauCfaSearch;
