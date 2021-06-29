import { debounce } from "debounce";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../common/httpClient";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../FiltersContext";

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
  const WithFormationSearch = (props) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState();

    useEffect(() => {
      setSearchResults(null);
      if (searchTerm.length > 3) {
        searchFormationByIntituleOrCfd({ searchTerm, ...props.filters }, (result) => {
          setSearchResults(result);
        });
      }
    }, [searchTerm]);

    return (
      <Component {...props} searchTerm={searchTerm} searchResults={searchResults} onSearchTermChange={setSearchTerm} />
    );
  };

  WithFormationSearch.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithFormationSearch;
};

export default withFormationSearch;
