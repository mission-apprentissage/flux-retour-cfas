import "@/styles/globals.css";
import "@/styles/MonthSelect.css";
import "remixicon/fonts/remixicon.css";
import "react-phone-input-2/lib/style.css";
import "react-datepicker/dist/react-datepicker.css";
import { ChakraProvider } from "@chakra-ui/react";
import { init } from "@socialgouv/matomo-next";
import { QueryClientProvider } from "@tanstack/react-query";
// besoin de date-fns 3 pour import esm, voir https://github.com/date-fns/date-fns/issues/2629
import fr from "date-fns/locale/fr"; // eslint-disable-line import/no-duplicates
import setDefaultOptions from "date-fns/setDefaultOptions"; // eslint-disable-line import/no-duplicates
import PlausibleProvider from "next-plausible";
import { useEffect } from "react";
import { RecoilRoot } from "recoil";

import { queryClient } from "@/common/queryClient";
import AlertMessage from "@/components/AlertMessage/AlertMessage";
import UserWrapper from "@/components/UserWrapper/UserWrapper";
import { publicConfig } from "@/config.public";
import Fonts from "@/theme/Fonts";
import theme from "@/theme/index";

setDefaultOptions({ locale: fr });

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    init(publicConfig.matomo);
  }, []);

  return (
    <PlausibleProvider domain={publicConfig.host} trackLocalhost={false}>
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
