import { fr } from "@codegouvfr/react-dsfr";

import { NotFoundBlock } from "@/app/_components/NotFoundBlock";

export default function DocsNotFound() {
  return (
    <main id="docs-not-found-content" className={fr.cx("fr-container", "fr-py-12w")}>
      <NotFoundBlock />
    </main>
  );
}
