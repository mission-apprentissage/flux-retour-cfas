import React, { useCallback, useEffect, useState } from "react";

import { _post } from "../../../common/httpClient";

const withJobEventsData = (Component) => {
  const WithJobEventsData = (props) => {
    let [data, setData] = useState(null);
    let [loading, setLoading] = useState(false);
    let [error, setError] = useState(null);

    const _fetch = useCallback(
      async (pageNumber = 1) => {
        setLoading(true);
        setError(null);

        try {
          const response = await _post("/api/jobEvents/", {
            page: pageNumber,
            limit: 10,
          });
          setData(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      },
      ["/api/jobEvents/"]
    );

    useEffect(() => {
      async function fetchData() {
        return _fetch();
      }
      fetchData();
    }, ["/api/jobEvents/", _fetch]);

    return <Component {...props} data={data} loading={loading} error={error} _fetch={_fetch} />;
  };
  return WithJobEventsData;
};

export default withJobEventsData;
