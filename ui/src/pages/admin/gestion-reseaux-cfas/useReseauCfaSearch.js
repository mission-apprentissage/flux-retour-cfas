import { useQuery } from "react-query";

import { fetchSearchReseauxCfas } from "../../../common/api/tableauDeBord";
import useDebounce from "../../../common/hooks/useDebounce";
import { omitNullishValues } from "../../../common/utils/omitNullishValues";

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
      return { id: id, uai_etablissement: uai, nom_etablissement: nom_etablissement, nom_reseau: nom_reseau };
    }),
    loading: isLoading,
  };
};

export default useReseauCfaSearch;
