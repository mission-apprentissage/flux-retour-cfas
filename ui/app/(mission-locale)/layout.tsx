import { fr } from "@codegouvfr/react-dsfr";
import dynamic from "next/dynamic";

import { ConnectedHeader } from "../_components/ConnectedHeader";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();
  const CrispChatNoSSR = dynamic(() => import("../_components/CrispChat").then((mod) => mod.CrispChat));

  return (
    <Providers>
      <UserContextProvider user={user}>
        <ConnectedHeader />
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
        <CrispChatNoSSR />
      </UserContextProvider>
    </Providers>
  );
}
