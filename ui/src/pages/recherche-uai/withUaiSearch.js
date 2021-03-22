import React, { useState } from "react";

import { _post } from "../../common/httpClient";

const withUaiSearch = (Component) => {
  const WithUaiSearch = (props) => {
    const [uaiInformation, setUaiInformation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const searchUaiInformation = async (uai) => {
      setLoading(true);
      setError(null);

      try {
        const response = await _post("/api/uai/search", { uai });
        setUaiInformation(response);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Component
        {...props}
        searchUaiInformation={searchUaiInformation}
        uaiInformation={uaiInformation}
        loading={loading}
        error={error}
      />
    );
  };

  return WithUaiSearch;
};

export default withUaiSearch;
