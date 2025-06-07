// eslint-disable-next-line import/no-named-as-default
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import PlausibleProvider from "next-plausible";

import { publicConfig } from "@/config.public";

import { DsfrProvider } from "./_dsfr-setup/dsfrProvider";
import { DsfrHead, getHtmlAttributes } from "./_dsfr-setup/server-only-index";

import "./global.css";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <html {...getHtmlAttributes({ lang: "fr" })}>
      <head>
        <DsfrHead
          preloadFonts={[
            //"Marianne-Light",
            //"Marianne-Light_Italic",
            "Marianne-Regular",
            //"Marianne-Regular_Italic",
            "Marianne-Medium",
            //"Marianne-Medium_Italic",
            "Marianne-Bold",
            //"Marianne-Bold_Italic",
            //"Spectral-Regular",
            //"Spectral-ExtraBold"
          ]}
        />
        <PlausibleProvider domain={publicConfig.host} />
      </head>
      <body>
        {
          <AppRouterCacheProvider>
            <DsfrProvider lang="fr">
              <MuiDsfrThemeProvider>{children}</MuiDsfrThemeProvider>
            </DsfrProvider>
          </AppRouterCacheProvider>
        }
      </body>
    </html>
  );
}
