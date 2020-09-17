import { useState, useCallback, useEffect } from "react";
import { _get } from "../httpClient";

export function useFetch(url, initialState = null) {
  const [response, setResponse] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const _fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await _get(url);
      setResponse(response);
      setLoading(false);
    } catch (error) {
      setError(error);
    }
  }, [url]);

  useEffect(() => {
    async function fetchData() {
      return _fetch();
    }
    fetchData();
  }, [url, _fetch]);

  return [response, loading, error];
}
