export function isLoadingVariation(isFetching: boolean, isLoading: boolean): boolean {
  return isFetching && !isLoading;
}
