import { useEffect, useState } from "react";

import { _get, _post } from "../httpClient";

export function useFetch(url) {
  const [response, setResponse] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const response = await _get(url);
        setResponse(response);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [url, refetchTrigger]);

  const refetch = () => setRefetchTrigger(refetchTrigger + 1);

  return [response, loading, error, refetch];
}

export function usePostFetch(url, body) {
  const [response, setResponse] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const response = await _post(url, body);
        setResponse(response);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [url, JSON.stringify(body), refetchTrigger]);

  const refetch = () => setRefetchTrigger(refetchTrigger + 1);

  return [response, loading, error, refetch];
}
