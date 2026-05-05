import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks";

import { Footer } from "../_components/Footer";
import { PublicHeader } from "../_components/PublicHeader";
import { Providers } from "../providers";

import styles from "./layout.module.scss";

export default async function RootLayout({ children }: { children: JSX.Element }) {
  return (
    <Providers>
      <div className={styles.layout}>
        <SkipLinks
          links={[
            { anchor: "#contenu", label: "Contenu" },
            { anchor: "#fr-header-simple-header-with-service-title-and-tagline", label: "Menu" },
            { anchor: "#fr-footer", label: "Pied de page" },
          ]}
        />
        <PublicHeader />
        <div id="contenu" tabIndex={-1} className={styles.main}>
          {children}
        </div>
        <Footer />
      </div>
    </Providers>
  );
}
