import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { ExtendedRecordMap } from "notion-types";

import { getNotionPage } from "@/app/_utils/notion.utils";
import { PAGES } from "@/app/_utils/routes.utils";

import { NotionBody } from "../../_components/NotionBody";

export const metadata = PAGES.static.docsKitDeploiementTbaReseaux.getMetadata();

const NOTION_PAGE_ID = "Kit-d-ploiement-Tableau-de-bord-R-seaux-cb16eaaf93f840ebb5d7bbcf68925774";

export default async function DocsKitDeploiementTbaReseauxPage() {
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
        <h1>Kit de déploiement : Réseaux</h1>
        <Alert
          severity="error"
          title="Contenu momentanément indisponible"
          description="Le kit de déploiement n’a pas pu être chargé. Merci de réessayer dans quelques instants."
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
