import { debounce } from "debounce";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../../common/httpClient";
import { omitNullishValues } from "../../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../../FiltersContext";

const SEARCH_DEBOUNCE_TIME = 300;

const searchFormationByIntituleOrCfd = debounce(async (searchParams, callback) => {
  const searchRequestBody = omitNullishValues({
    searchTerm: searchParams.searchTerm,
    etablissement_num_region: searchParams.region?.code ?? null,
    etablissement_num_departement: searchParams.departement?.code ?? null,
  });

  const result = await _post("/api/formations/search", searchRequestBody);
  callback(result);
}, SEARCH_DEBOUNCE_TIME);

const withFormationSearch = (Component) => {
  const WithFormationSearch = ({ filters, ...props }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState();

    useEffect(() => {
      // perform search with searchTerm only if longer than 3 characters
      const searchCriteria = searchTerm.length > 3 ? { searchTerm, ...filters } : filters;
      // perform search if there is at least one search criterion
      if (Object.keys(searchCriteria).length !== 0) {
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
