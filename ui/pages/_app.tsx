import "@/styles/globals.css";

import { ChakraProvider } from "@chakra-ui/react";
import { init } from "@socialgouv/matomo-next";
import { QueryClientProvider } from "@tanstack/react-query";
// besoin de date-fns 3 pour import esm, voir https://github.com/date-fns/date-fns/issues/2629
import fr from "date-fns/locale/fr"; // eslint-disable-line import/no-duplicates
import setDefaultOptions from "date-fns/setDefaultOptions"; // eslint-disable-line import/no-duplicates
import dynamic from "next/dynamic";
import PlausibleProvider from "next-plausible";
import { useEffect } from "react";
import { RecoilRoot } from "recoil";

import { queryClient } from "@/common/queryClient";
import UserWrapper from "@/components/UserWrapper/UserWrapper";
import { publicConfig } from "@/config.public";
import { marianne } from "@/theme/fonts";
import theme from "@/theme/index";

const AlertMessage = dynamic(() => import("@/components/AlertMessage/AlertMessage"), { ssr: false });

setDefaultOptions({ locale: fr });

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    init(publicConfig.matomo);
  }, []);

  return (
    <PlausibleProvider domain={publicConfig.host} trackLocalhost={false}>
      <RecoilRoot>
        <div className={marianne.className}>
          <ChakraProvider theme={theme} resetCSS>
            <QueryClientProvider client={queryClient}>
              <AlertMessage />
              <UserWrapper ssrAuth={pageProps.auth}>
                <Component {...pageProps} />
              </UserWrapper>
            </QueryClientProvider>
          </ChakraProvider>
        </div>
      </RecoilRoot>
    </PlausibleProvider>
  );
}

export default MyApp;
