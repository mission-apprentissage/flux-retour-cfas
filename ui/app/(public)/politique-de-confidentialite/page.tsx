import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { ExtendedRecordMap } from "notion-types";

import { getNotionPage } from "@/app/_utils/notion.utils";
import { PAGES } from "@/app/_utils/routes.utils";

import { NotionBody } from "../_components/NotionBody";

export const metadata = PAGES.static.politiqueConfidentialite.getMetadata();

const NOTION_PAGE_ID = "Politique-de-confidentialit-7b1c32f4c2214e0c9523686b18ada6fa";

export default async function PolitiqueDeConfidentialitePage() {
  let recordMap: ExtendedRecordMap | null = null;

  try {
    recordMap = await getNotionPage(NOTION_PAGE_ID);
  } catch (error) {
    console.error(`Échec du chargement de la page Notion ${NOTION_PAGE_ID}`, error);
    recordMap = null;
  }

  if (!recordMap) {
    return (
      <main className={fr.cx("fr-container", "fr-py-6w")}>
        <h1>Politique de confidentialité</h1>
        <Alert
          severity="error"
          title="Contenu momentanément indisponible"
          description="La politique de confidentialité n’a pas pu être chargée. Merci de réessayer dans quelques instants."
        />
      </main>
    );
  }

  return (
    <main>
      <NotionBody recordMap={recordMap} />
    </main>
  );
}
