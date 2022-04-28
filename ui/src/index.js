import "./index.css";
import "remixicon/fonts/remixicon.css";
import "whatwg-fetch";

import { ChakraProvider } from "@chakra-ui/react";
import * as React from "react";
import ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import App from "./App";
import theme from "./theme/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // retry failing requests just once, see https://react-query.tanstack.com/guides/query-retries
      retryDelay: 3000, // retry failing requests after 3 seconds
      refetchOnWindowFocus: false, // see https://react-query.tanstack.com/guides/important-defaults
      refetchOnReconnect: false,
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme} resetCSS>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
