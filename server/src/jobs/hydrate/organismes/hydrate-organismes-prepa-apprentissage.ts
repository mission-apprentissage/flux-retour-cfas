import { PromisePool } from "@supercharge/promise-pool";

import parentLogger from "@/common/logger";
import { organismesPrepaApprentissageDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

const logger = parentLogger.child({ module: "job:hydrate:organismes-prepa-apprentissage" });
const PREPA_APPRENTISSAGE_CSV_FILE_PATH = "organismes/organismes-prepa-apprentissage.csv";

/**
 * Ce job peuple la collection organismesPrepaApprentissage avec le contenu du fichier CSV
 */
export const hydrateOrganismesPrepaApprentissage = async () => {
  logger.info("Clear de la collection organismesPrepaApprentissage...");
  await organismesPrepaApprentissageDb().deleteMany({});

  // Lecture du fichier CSV
  const filePath = getStaticFilePath(PREPA_APPRENTISSAGE_CSV_FILE_PATH);
  const prepaApprentissageFile = readJsonFromCsvFile(filePath, ";");

  logger.info(prepaApprentissageFile.length, "lignes dans le fichier");
  if (prepaApprentissageFile.length === 0) {
    throw new Error(`Le fichier est vide`);
  }

  // Traitement // sur toutes les lignes du fichier
  await PromisePool.for(prepaApprentissageFile).process(
    async ({
      uai,
      siret,
      raison_sociale,
      enseigne,
      nature,
      departement,
      commune,
      code_postal,
      adresse,
      prepa_apprentissage,
    }: any) => {
      await organismesPrepaApprentissageDb().insertOne({
        uai,
        siret,
        raison_sociale,
        enseigne,
        nature,
        departement,
        commune,
        code_postal,
        adresse,
        prepa_apprentissage,
      });
    }
  );

  logger.info("Collection organismesPrepaApprentissage initialisée avec succès !");
};
