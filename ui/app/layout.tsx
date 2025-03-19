import { fr } from "@codegouvfr/react-dsfr";
// eslint-disable-next-line import/no-named-as-default
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Link from "next/link";
import PlausibleProvider from "next-plausible";

import { publicConfig } from "@/config.public";

import { UserContextProvider } from "./_components/context/UserContext";
import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { defaultColorScheme } from "./_dsfr-setup/default-color-scheme";
import { StartDsfr } from "./_dsfr-setup/start-dsfr";
import { getSession } from "./_utils/session.utils";
import { Providers } from "./providers";
import "./global.css";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();
  return (
    <html {...getHtmlAttributes({ defaultColorScheme })}>
      <head>
        <StartDsfr />
        <DsfrHead
          Link={Link}
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
            <DsfrProvider>
              <MuiDsfrThemeProvider>
                <Providers>
                  <UserContextProvider user={user}>
                    <Header />
                    <div
                      style={{
                        flex: 1,
                        margin: "auto",
                        maxWidth: 1232,
                        ...fr.spacing("padding", {
                          topBottom: "10v",
                        }),
                      }}
                    >
                      {children}
                    </div>
                    <Footer />
                  </UserContextProvider>
                </Providers>
              </MuiDsfrThemeProvider>
            </DsfrProvider>
          </AppRouterCacheProvider>
        }
      </body>
    </html>
  );
}
