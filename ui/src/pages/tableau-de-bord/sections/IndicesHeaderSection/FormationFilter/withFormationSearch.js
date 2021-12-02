import { debounce } from "debounce";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../../common/httpClient";
import { omitNullishValues } from "../../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../../FiltersContext";

const SEARCH_DEBOUNCE_TIME = 300;
const MINIMUM_CHARS_TO_PERFORM_SEARCH = 4;

const searchFormationByIntituleOrCfd = debounce(async (searchParams, callback) => {
  const query = {
    searchTerm: searchParams.searchTerm,
    etablissement_num_region: searchParams.region?.code ?? null,
    etablissement_num_departement: searchParams.departement?.code ?? null,
    etablissement_reseaux: searchParams.reseau?.nom ?? null,
  };
  const result = await _post("/api/formations/search", omitNullishValues(query));
  callback(result);
}, SEARCH_DEBOUNCE_TIME);

const withFormationSearch = (Component) => {
  const WithFormationSearch = ({ filters, ...props }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState();

    useEffect(() => {
      // perform search if user has entered at least 4 chars or none
      if (searchTerm.length === 0 || searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH) {
        const searchCriteria =
          searchTerm.length >= MINIMUM_CHARS_TO_PERFORM_SEARCH ? { searchTerm, ...filters } : filters;
        setSearchResults(null);
        setLoading(true);
        searchFormationByIntituleOrCfd(searchCriteria, (result) => {
          setSearchResults(result);
          setLoading(false);
        });
      }
    }, [searchTerm, filters]);

    return (
      <Component
        {...props}
        filters={filters}
        loading={loading}
        searchTerm={searchTerm}
        searchResults={searchResults}
        onSearchTermChange={setSearchTerm}
      />
    );
  };

  WithFormationSearch.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithFormationSearch;
};

export default withFormationSearch;
