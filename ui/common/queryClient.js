import { QueryClient } from "@tanstack/react-query";

const QUERY_CLIENT_RETRY_DELAY = 3000;
const QUERY_CLIENT_RETRY_ATTEMPTS = 1;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_CLIENT_RETRY_ATTEMPTS, // retry failing requests just once, see https://react-query.tanstack.com/guides/query-retries
      retryDelay: QUERY_CLIENT_RETRY_DELAY, // retry failing requests after 3 seconds
      refetchOnWindowFocus: false, // see https://react-query.tanstack.com/guides/important-defaults
      refetchOnReconnect: false,
    },
  },
});
