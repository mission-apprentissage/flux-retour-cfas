import { PromisePool } from "@supercharge/promise-pool";
import { ObjectId } from "mongodb";

import parentLogger from "@/common/logger";
import { organismesSolteaDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

const logger = parentLogger.child({ module: "job:hydrate:organismes-soltea" });
const SOLTEA_CSV_FILE_PATH = "organismes/SOLTEA_extrac_etab_bene.csv";

/**
 * Ce job peuple la collection organismesSoltea avec le contenu du fichier CSV
 */
export const hydrateOrganismesSoltea = async () => {
  logger.info("Clear de la collection organismesSoltea...");
  await organismesSolteaDb().deleteMany({});

  // Lecture du fichier CSV
  const filePath = getStaticFilePath(SOLTEA_CSV_FILE_PATH);
  const solteaFile = readJsonFromCsvFile(filePath, ";");

  logger.info(solteaFile.length, "lignes dans le fichier");
  if (solteaFile.length === 0) {
    throw new Error(`Le fichier est vide`);
  }

  // Traitement // sur toutes les lignes du fichier
  await PromisePool.for(solteaFile).process(
    async ({
      uai,
      siret,
      raison_sociale,
      ligne1_adresse,
      ligne2_adresse,
      ligne3_adresse,
      ligne4_adresse,
      ligne5_adresse,
      commune,
      code_postal,
      departement,
    }: any) => {
      await organismesSolteaDb().insertOne({
        _id: new ObjectId(),
        uai,
        siret,
        raison_sociale,
        ligne1_adresse,
        ligne2_adresse,
        ligne3_adresse,
        ligne4_adresse,
        ligne5_adresse,
        commune,
        code_postal,
        departement,
      });
    }
  );

  logger.info("Collection organismesSoltea initialisée avec succès !");
};
