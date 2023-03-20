import "../styles/globals.css";
import "../styles/MonthSelect.css";
import "remixicon/fonts/remixicon.css";
import "react-phone-input-2/lib/style.css";
import "react-datepicker/dist/react-datepicker.css";
import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import { QueryClientProvider } from "@tanstack/react-query";
import PlausibleProvider from "next-plausible";

import Fonts from "../theme/Fonts";
import theme from "../theme/index";
import UserWrapper from "@/components/UserWrapper/UserWrapper";
import AlertMessage from "@/components/AlertMessage/AlertMessage";
import { queryClient } from "@/common/queryClient";

import fr from "date-fns/locale/fr";
import setDefaultOptions from "date-fns/setDefaultOptions";
setDefaultOptions({ locale: fr });

function MyApp({ Component, pageProps }) {
  return (
    <PlausibleProvider domain={process.env.NEXT_PUBLIC_BASE_HOST!} trackLocalhost={false}>
      <RecoilRoot>
        <ChakraProvider theme={theme} resetCSS>
          <Fonts />
          <QueryClientProvider client={queryClient}>
            <AlertMessage />
            <UserWrapper ssrAuth={pageProps.auth}>
              <Component {...pageProps} />
            </UserWrapper>
          </QueryClientProvider>
        </ChakraProvider>
      </RecoilRoot>
    </PlausibleProvider>
  );
}

export default MyApp;
