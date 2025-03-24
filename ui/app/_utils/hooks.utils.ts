import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useClientQuery<
  TData = unknown,
  TError = unknown,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TData>,
  options?: UseQueryOptions<TData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return useQuery<TData, TError, TData, TQueryKey>(queryKey, queryFn, {
    enabled: isClient && (options?.enabled ?? true),
    suspense: options?.suspense ?? false,
    ...options,
  });
}
