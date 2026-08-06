import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks";
import { ReactNode } from "react";

import { ConnectedHeader } from "../_components/ConnectedHeader";
import { UserContextProvider } from "../_components/context/UserContext";
import { Footer } from "../_components/Footer";
import { PublicHeader } from "../_components/PublicHeader";
import { getSession } from "../_utils/session.utils";
import { Providers } from "../providers";

import styles from "./connexion-api.module.scss";

export default async function ConnexionApiLayout({ children }: { children: ReactNode }) {
  const user = await getSession();

  return (
    <Providers>
      <UserContextProvider user={user}>
        <div className={styles.layout}>
          <SkipLinks links={[{ anchor: "#contenu", label: "Contenu" }]} />
          {user ? <ConnectedHeader /> : <PublicHeader />}
          <div id="contenu" tabIndex={-1} className={styles.main}>
            {children}
          </div>
          <Footer />
        </div>
      </UserContextProvider>
    </Providers>
  );
}
