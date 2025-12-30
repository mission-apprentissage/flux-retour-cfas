import { fr } from "@codegouvfr/react-dsfr";
import { Metadata } from "next";

import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

import { DecommissionnementHeader } from "./DecommissionnementHeader";

export const metadata: Metadata = {
  title: "Service indisponible - Tableau de bord de l'apprentissage",
};

export default async function DecommissionnementLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <DecommissionnementHeader />
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
