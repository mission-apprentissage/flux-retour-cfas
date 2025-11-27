const THIRTY_MINUTES = 30 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export const STATS_QUERY_CONFIG = {
  staleTime: THIRTY_MINUTES,
  cacheTime: ONE_HOUR,
  retry: 3,
  refetchOnWindowFocus: false,
} as const;

export const STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA = {
  ...STATS_QUERY_CONFIG,
  keepPreviousData: true,
} as const;
