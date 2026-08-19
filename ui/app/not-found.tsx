import { fr } from "@codegouvfr/react-dsfr";
import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks";

import { Footer } from "./_components/Footer";
import { NotFoundBlock } from "./_components/NotFoundBlock";
import { PublicHeader } from "./_components/PublicHeader";

export default function NotFound() {
  return (
    <>
      <SkipLinks
        links={[
          { anchor: "#contenu", label: "Contenu" },
          { anchor: "#fr-footer", label: "Pied de page" },
        ]}
      />
      <PublicHeader />
      <main id="contenu" tabIndex={-1} className={fr.cx("fr-container", "fr-py-12w")}>
        <NotFoundBlock />
      </main>
      <Footer />
    </>
  );
}
