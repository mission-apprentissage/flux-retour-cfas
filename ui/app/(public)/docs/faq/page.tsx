import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { ExtendedRecordMap } from "notion-types";

import { getNotionPage } from "@/app/_utils/notion.utils";
import { PAGES } from "@/app/_utils/routes.utils";

import { NotionBody } from "../../_components/NotionBody";

export const metadata = PAGES.static.docsFaq.getMetadata();

const NOTION_PAGE_ID = "Page-d-Aide-FAQ-dbb1eddc954441eaa0ba7f5c6404bdc0";

export default async function DocsFaqPage() {
  let recordMap: ExtendedRecordMap | null = null;

  try {
    recordMap = await getNotionPage(NOTION_PAGE_ID);
  } catch (error) {
    console.error(`Échec du chargement de la page Notion ${NOTION_PAGE_ID}`, error);
    recordMap = null;
  }

  if (!recordMap) {
    return (
      <main id="docs-faq-content" className={fr.cx("fr-container", "fr-py-6w")}>
        <h1>Page d’aide & FAQ</h1>
        <Alert
          severity="error"
          title="Contenu momentanément indisponible"
          description="La page d’aide n’a pas pu être chargée. Merci de réessayer dans quelques instants."
        />
      </main>
    );
  }

  return (
    <main id="docs-faq-content">
      <NotionBody recordMap={recordMap} />
    </main>
  );
}
