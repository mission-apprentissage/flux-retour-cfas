import { debounce } from "debounce";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../common/httpClient";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropType } from "../../propTypes";
import { TERRITOIRE_TYPES } from "../territoire/withTerritoireData";

const SEARCH_DEBOUNCE_TIME = 300;

const searchFormationByIntituleOrCfd = debounce(async (searchParams, callback) => {
  const searchRequestBody = omitNullishValues({
    searchTerm: searchParams.searchTerm,
    etablissement_num_region:
      searchParams.territoire?.type === TERRITOIRE_TYPES.region ? searchParams.territoire.code : null,
    etablissement_num_departement:
      searchParams.territoire?.type === TERRITOIRE_TYPES.departement ? searchParams.territoire.code : null,
  });

  const result = await _post("/api/formations/search", searchRequestBody);
  callback(result);
}, SEARCH_DEBOUNCE_TIME);

const withFormationSearch = (Component) => {
  const WithFormationSearch = ({ filters, ...props }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState();

    useEffect(() => {
      setSearchResults(null);
      if (searchTerm.length > 3) {
        searchFormationByIntituleOrCfd({ searchTerm, ...filters }, (result) => {
          setSearchResults(result);
        });
      }
    }, [searchTerm]);

    return (
      <Component {...props} searchTerm={searchTerm} searchResults={searchResults} onSearchTermChange={setSearchTerm} />
    );
  };

  WithFormationSearch.propTypes = {
    filters: filtersPropType,
  };

  return WithFormationSearch;
};

export default withFormationSearch;
