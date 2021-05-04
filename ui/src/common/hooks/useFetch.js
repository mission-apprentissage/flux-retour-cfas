import { useCallback, useEffect, useState } from "react";

import { _get, _post } from "../httpClient";

export function useFetch(url, initialState = null) {
  const [response, setResponse] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await _get(url);
      setResponse(response);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [url, refetchTrigger]);

  const refetch = () => setRefetchTrigger(refetchTrigger + 1);

  return [response, loading, error, refetch];
}

export function usePostFetch(url, body, initialState = null) {
  const [response, setResponse] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const _fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await _post(url, body);
      setResponse(response);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(body)]);

  useEffect(() => {
    async function fetchData() {
      return _fetch();
    }
    fetchData();
  }, [_fetch]);

  return [response, loading, error];
}
