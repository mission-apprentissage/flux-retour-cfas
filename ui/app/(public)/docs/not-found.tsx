import { fr } from "@codegouvfr/react-dsfr";

import { NotFoundBlock } from "@/app/_components/NotFoundBlock";

export default function DocsNotFound() {
  return (
    <main className={fr.cx("fr-container", "fr-py-12w")}>
      <NotFoundBlock />
    </main>
  );
}
