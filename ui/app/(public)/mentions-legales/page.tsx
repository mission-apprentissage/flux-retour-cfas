import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { ExtendedRecordMap } from "notion-types";

import { getNotionPage } from "@/app/_utils/notion.utils";
import { PAGES } from "@/app/_utils/routes.utils";

import { NotionBody } from "../_components/NotionBody";

export const metadata = PAGES.static.mentionsLegales.getMetadata();

const NOTION_PAGE_ID = "Mentions-l-gales-002a2868ea2f46cdb2d73207d12b6075";

export default async function MentionsLegalesPage() {
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
        <h1>Mentions légales</h1>
        <Alert
          severity="error"
          title="Contenu momentanément indisponible"
          description="Les mentions légales n’ont pas pu être chargées. Merci de réessayer dans quelques instants."
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
