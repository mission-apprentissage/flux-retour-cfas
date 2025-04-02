import { fr } from "@codegouvfr/react-dsfr";

import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { Header } from "../_components/Header";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  const user = await getSession();
  return (
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
  );
}
