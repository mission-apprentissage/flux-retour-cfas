import type { UseQueryResult } from "@tanstack/react-query";

export function useLoadingVariation<T>(query: Pick<UseQueryResult<T>, "isFetching" | "isLoading">): boolean {
  return query.isFetching && !query.isLoading;
}

export function isLoadingVariation(isFetching: boolean, isLoading: boolean): boolean {
  return isFetching && !isLoading;
}
