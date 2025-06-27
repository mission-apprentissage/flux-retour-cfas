import { fr } from "@codegouvfr/react-dsfr";

import { ConnectedHeaderARML } from "../_components/arml/ConnectedHeaderARML";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <ConnectedHeaderARML />
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
  );
}
