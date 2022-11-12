import "../styles/globals.css";
import "../styles/MonthSelect.css";
import "react-datepicker/dist/react-datepicker.css";
import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Fonts from "../theme/Fonts";
import theme from "../theme/index";
import UserWrapper from "../components/UserWrapper/UserWrapper";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  return (
    <RecoilRoot>
      <ChakraProvider theme={theme} resetCSS>
        <Fonts />
        <QueryClientProvider client={queryClient}>
          <UserWrapper ssrAuth={pageProps.auth}>
            <Component {...pageProps} />
          </UserWrapper>
        </QueryClientProvider>
      </ChakraProvider>
    </RecoilRoot>
  );
}

export default MyApp;
