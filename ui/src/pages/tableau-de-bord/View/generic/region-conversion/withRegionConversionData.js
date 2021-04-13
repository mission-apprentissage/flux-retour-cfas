import React, { useEffect, useState } from "react";

import { _post } from "../../../../../common/httpClient";
import { filtersPropType } from "../../../propTypes";

const withRegionConversionData = (Component) => {
  const WithRegionConversionData = ({ filters, ...props }) => {
    const [regionConversionData, setRegionConversionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const regionCodeInput = filters?.territoire?.code;

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await _post("/api/dashboard/region-conversion", { num_region: regionCodeInput });
          setRegionConversionData(response);
          setError(null);
        } catch (err) {
          setError(err);
          setRegionConversionData(null);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [regionCodeInput]);

    return (
      <Component
        {...props}
        filters={filters}
        regionConversionData={regionConversionData}
        error={error}
        loading={loading}
      />
    );
  };

  WithRegionConversionData.propTypes = {
    filters: filtersPropType,
  };

  return WithRegionConversionData;
};

export default withRegionConversionData;
