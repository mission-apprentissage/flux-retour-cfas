import { captureException } from "@sentry/node";
import { ObjectId } from "mongodb";

import logger from "@/common/logger";
import { organismesDb, reseauxDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";

const INPUT_FILE_COLUMN_NAMES = {
  SIRET: "Siret",
  UAI: "UAIvalidée",
  RESEAUX_A_JOUR: "Réseauxàjour",
};

const RESEAUX_LIST_SEPARATOR = "|";

const RESEAU_NULL_VALUES = ["Hors réseau CFA EC", "", null];

/**
 * Tri des fichiers réseaux à traiter pour appliquer les réseaux multiples sans erreurs
 */
const INPUT_FILES = [
  "reseaux/referentiel-reseau-mfr.csv", // MFR
  "reseaux/referentiel-reseau-cr-normandie.csv", // CR Normandie
  "reseaux/referentiel-reseau-aftral.csv", // AFTRAL
  "reseaux/referentiel-reseau-cci.csv", // CCI
  "reseaux/referentiel-reseau-cma.csv", // CMA
  "reseaux/referentiel-reseau-aden.csv", // ADEN
  "reseaux/referentiel-reseau-agri.csv", // AGRI
  // "reseaux/referentiel-reseau-anasup.csv", // TODO Fichier non fourni pour l'instant
  // "reseaux/referentiel-reseau-dgesip.csv", // TODO Fichier non fourni pour l'instant
  "reseaux/referentiel-reseau-compagnons-du-tour-de-france.csv", // Compagnons du tour de france
  "reseaux/referentiel-reseau-uimm.csv", // UIMM
  "reseaux/referentiel-reseau-greta.csv", // GRETA
  "reseaux/referentiel-reseau-en.csv", // EDUC. NAT
  // "reseaux/referentiel-reseau-ccca-btp.csv", // TODO Fichier non fourni pour l'instant
  "reseaux/referentiel-reseau-amue.csv", // AMUE
  "reseaux/referentiel-reseau-cfa-ec.csv", // CFA EC
  "reseaux/referentiel-reseau-compagnons-du-devoir.csv", // Compagnons du devoir
  "reseaux/referentiel-reseau-eduservice.csv",
  "reseaux/referentiel-reseau-afpa.csv",
];

/**
 * Parse des réseaux depuis le csv
 */
const parseReseauxTextFromCsv = (reseauText: string): string[] => {
  if (!reseauText || RESEAU_NULL_VALUES.includes(reseauText)) return [];
  return reseauText.split(RESEAUX_LIST_SEPARATOR).map((reseau) => reseau.toUpperCase().trim());
};

/**
 * Fonction de remplissage de la collection reseaux
 */
export const populateReseauxCollection = async (): Promise<void> => {
  const uniqueReseaux = new Set<string>();

  for (const file of INPUT_FILES) {
    try {
      const filePath = getStaticFilePath(file);
      const reseauFile = readJsonFromCsvFile(filePath, ";");

      reseauFile.forEach((row: any) => {
        const reseaux = parseReseauxTextFromCsv(row[INPUT_FILE_COLUMN_NAMES.RESEAUX_A_JOUR]);
        reseaux.forEach((reseau) => uniqueReseaux.add(reseau));
      });

      logger.info(`Fichier traité avec succès : ${file}`);
    } catch (error) {
      logger.error(`Erreur lors du traitement du fichier ${file} :`, error);
      captureException(error);
    }
  }

  await Promise.all(
    Array.from(uniqueReseaux).map(async (reseau) => {
      try {
        const organismes = await organismesDb()
          .find({ reseaux: { $in: [reseau] } })
          .project({ _id: 1 })
          .toArray();

        const reseauToOrganismesMap = organismes
          .map((organisme) => organisme._id)
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        await reseauxDb().updateOne(
          { key: reseau },
          { $set: { organismes_ids: reseauToOrganismesMap as ObjectId[], updated_at: new Date() } }
        );
      } catch (error) {
        logger.error(`Erreur lors de la récupération des organismes pour le réseau ${reseau} :`, error);
        captureException(error);
      }
    })
  );
};
