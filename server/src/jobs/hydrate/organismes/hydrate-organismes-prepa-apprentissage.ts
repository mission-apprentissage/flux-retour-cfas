import { PromisePool } from "@supercharge/promise-pool";

import { findOrganismeByUaiAndSiret, updateOrganisme } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

const logger = parentLogger.child({ module: "job:hydrate:organismes-prepa-apprentissage" });
const PREPA_APPRENTISSAGE_CSV_FILE_PATH = "organismes/organismes-prepa-apprentissage.csv";

/**
 * Ce job remplit le champ prepa_apprentissage des organismes avec le contenu du fichier CSV prepa_apprentissage
 */
export const hydrateOrganismesPrepaApprentissage = async () => {
  // Lecture du fichier CSV
  const filePath = getStaticFilePath(PREPA_APPRENTISSAGE_CSV_FILE_PATH);
  const prepaApprentissageFile = readJsonFromCsvFile(filePath, ";");

  logger.info(prepaApprentissageFile.length, "lignes dans le fichier");
  if (prepaApprentissageFile.length === 0) {
    throw new Error(`Le fichier est vide`);
  }

  // Traitement // sur toutes les lignes du fichier
  await PromisePool.for(prepaApprentissageFile).process(async ({ uai, siret, prepa_apprentissage }: any) => {
    const foundInOrganismes = await findOrganismeByUaiAndSiret(uai, siret);

    // Match sur un couple trouvé dans les organismes et champ X dans le csv
    if (foundInOrganismes && prepa_apprentissage === "X") {
      await updateOrganisme(foundInOrganismes._id, {
        ...foundInOrganismes,
        prepa_apprentissage: true,
      });
    }
  });

  logger.info("Champ prepa_apprentissage initialisé avec succès !");
};
