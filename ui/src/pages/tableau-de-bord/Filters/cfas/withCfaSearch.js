import { debounce } from "debounce";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../common/httpClient";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropType } from "../../propTypes";
import { TERRITOIRE_TYPES } from "../territoire/withTerritoireData";

const SEARCH_DEBOUNCE_TIME = 300;

const searchCfaBySiretOrUai = debounce(async (searchParams, callback) => {
  const searchRequestBody = omitNullishValues({
    searchTerm: searchParams.searchTerm,
    etablissement_num_region:
      searchParams.territoire?.type === TERRITOIRE_TYPES.region ? searchParams.territoire.code : null,
    etablissement_num_departement:
      searchParams.territoire?.type === TERRITOIRE_TYPES.departement ? searchParams.territoire.code : null,
  });
  const result = await _post("/api/cfas/search", searchRequestBody);
  callback(result);
}, SEARCH_DEBOUNCE_TIME);

const withCfaSearch = (Component) => {
  const WithCfaSearch = ({ filters, ...props }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState();

    useEffect(() => {
      setSearchResults(null);
      if (searchTerm.length > 3) {
        searchCfaBySiretOrUai({ searchTerm, ...filters }, (result) => {
          setSearchResults(result);
        });
      }
    }, [searchTerm]);

    return (
      <Component {...props} searchTerm={searchTerm} searchResults={searchResults} onSearchTermChange={setSearchTerm} />
    );
  };

  WithCfaSearch.propTypes = {
    filters: filtersPropType,
  };

  return WithCfaSearch;
};

export default withCfaSearch;
