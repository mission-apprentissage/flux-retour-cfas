import "./index.css";
import "remixicon/fonts/remixicon.css";
import "whatwg-fetch";

import { ChakraProvider } from "@chakra-ui/react";
import * as React from "react";
import ReactDOM from "react-dom";
import { QueryClientProvider } from "react-query";

import App from "./App";
import { queryClient } from "./queryClient";
import theme from "./theme/theme";

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
