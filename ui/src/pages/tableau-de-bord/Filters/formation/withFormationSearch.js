import { debounce } from "debounce";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../common/httpClient";
import { filtersPropType } from "../../propTypes";

const SEARCH_DEBOUNCE_TIME = 300;

const searchFormationByIntituleOrCfd = debounce(async ({ searchTerm }, callback) => {
  const result = await _post("/api/formations/search", { searchTerm });
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
