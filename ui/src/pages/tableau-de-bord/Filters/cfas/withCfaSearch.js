import { debounce } from "debounce";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../common/httpClient";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../FiltersContext";

const SEARCH_DEBOUNCE_TIME = 300;

const searchCfas = debounce(async (searchCriteria, callback) => {
  const searchRequestBody = omitNullishValues({
    searchTerm: searchCriteria.searchTerm,
    etablissement_num_region: searchCriteria.region?.code ?? null,
    etablissement_num_departement: searchCriteria.departement?.code ?? null,
  });
  const result = await _post("/api/cfas/search", searchRequestBody);
  callback(result);
}, SEARCH_DEBOUNCE_TIME);

const withCfaSearch = (Component) => {
  const WithCfaSearch = ({ filters, ...props }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState();

    useEffect(() => {
      // perform search with searchTerm only if longer than 3 characters
      const searchCriteria = searchTerm.length > 3 ? { searchTerm, ...filters } : filters;

      // perform search if there is at least one search criterion
      if (Object.keys(searchCriteria).length !== 0) {
        setSearchResults(null);
        searchCfas(searchCriteria, (result) => {
          setSearchResults(result);
        });
      }
    }, [searchTerm, filters]);

    return (
      <Component {...props} searchTerm={searchTerm} searchResults={searchResults} onSearchTermChange={setSearchTerm} />
    );
  };

  WithCfaSearch.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithCfaSearch;
};

export default withCfaSearch;
