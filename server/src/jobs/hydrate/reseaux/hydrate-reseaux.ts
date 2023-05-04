import path from "path";

import Logger from "bunyan";
import { WithId } from "mongodb";

import { findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { STATUT_FIABILISATION_ORGANISME } from "@/common/constants/fiabilisation";
import { organismesDb } from "@/common/model/collections";
import { asyncForEach } from "@/common/utils/asyncUtils";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { arraysContainSameValues } from "@/common/utils/miscUtils";

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
  "assets/referentiel-reseau-excellence-pro.csv", // CFA_EC
  "assets/referentiel-reseau-mfr.csv", // MFR
  "assets/referentiel-reseau-cr-normandie.csv", // CR Normandie
  "assets/referentiel-reseau-aftral.csv", // AFTRAL
  "assets/referentiel-reseau-cci.csv", // CCI
  "assets/referentiel-reseau-cma.csv", // CMA
  "assets/referentiel-reseau-aden.csv", // ADEN
  "assets/referentiel-reseau-agri.csv", // AGRI
  // "assets/referentiel-reseau-anasup.csv", // TODO Fichier non fourni pour l'instant
  // "assets/referentiel-reseau-dgesip.csv", // TODO Fichier non fourni pour l'instant
  "assets/referentiel-reseau-compagnons-du-devoir.csv", // Compagnons du devoir
  "assets/referentiel-reseau-uimm.csv", // UIMM
  "assets/referentiel-reseau-greta.csv", // GRETA
  "assets/referentiel-reseau-en.csv", // EDUC. NAT
  // "assets/referentiel-reseau-ccca-btp.csv", // TODO Fichier non fourni pour l'instant
];

/**
 * Parse des réseaux depuis le csv
 * @param  {string} reseauText
 * @returns {string[]} List of parsed réseaux
 */
const parseReseauxTextFromCsv = (reseauText) => {
  if (!reseauText || RESEAU_NULL_VALUES.includes(reseauText)) {
    return [];
  }
  const reseaux = reseauText.split(RESEAUX_LIST_SEPARATOR).map((reseau) => reseau.toUpperCase());
  return reseaux;
};

/**
 * Fonction de transformation d'une ligne en objet organisme
 * @param {*} organismeFromFile
 * @returns
 */
const mapFileOrganisme = (organismeFromFile) => {
  return {
    siret: organismeFromFile[INPUT_FILE_COLUMN_NAMES.SIRET],
    uai: organismeFromFile[INPUT_FILE_COLUMN_NAMES.UAI] || undefined,
    reseaux: parseReseauxTextFromCsv(organismeFromFile[INPUT_FILE_COLUMN_NAMES.RESEAUX_A_JOUR]),
  };
};

/**
 * Fonction de remise à zero des réseaux dans la collection organismes
 */
const clearReseauxInOrganismes = async (logger: Logger) => {
  logger.info("Remise à zero des réseaux pour tous les organismes...");
  await organismesDb().updateMany({ siret: { $exists: true } }, { $set: { reseaux: [] } });
};

/**
 * Fonction de remplissage des réseaux
 */
export const hydrateReseaux = async (logger: Logger) => {
  await clearReseauxInOrganismes(logger);

  for (const currentReseauFile of INPUT_FILES) {
    await hydrateReseauFile(logger, currentReseauFile);
  }
};

/**
 * Fonction de remplissage des données d'un fichier réseau
 * @param {*} filename
 */
const hydrateReseauFile = async (logger: Logger, filename: string) => {
  logger.info("Import des données réseaux de ", filename);

  // read référentiel file from réseau and convert it to JSON
  const filePath = path.join(__dirname(import.meta.url), filename);
  const reseauFile = readJsonFromCsvFile(filePath, ";");

  // init counters for final log
  let foundCount = 0;
  let foundUniqueCount = 0;
  let organismeUpdatedCount = 0;
  let organismeUpdateErrorCount = 0;

  logger.info(reseauFile.length, "lignes dans le fichier", filename);
  if (reseauFile.length === 0) {
    throw new Error(`Le fichier ${filename} est vide`);
  }

  // iterate over every line (organisme de formation) in the réseau file
  await asyncForEach(reseauFile, async (reseauFileLine) => {
    const organismeParsedFromFile = mapFileOrganisme(reseauFileLine);

    /*
        1 - Add réseau information to organisme in TDB, if found unique
      */
    // try to retrieve organisme in our database with UAI and SIRET if UAI is provided
    // if UAI not provided find organismes fiables with the SIRET
    /** @type {(import("mongodb").WithId<any>)[]} */
    const organismeInTdb = organismeParsedFromFile.uai
      ? [await findOrganismeByUaiAndSiret(organismeParsedFromFile.uai, organismeParsedFromFile.siret)].filter((o) => o)
      : await organismesDb()
          .find({ siret: organismeParsedFromFile.siret, fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE })
          .toArray();

    const found = organismeInTdb?.length !== 0;
    const foundUnique = found && organismeInTdb?.length === 1;

    if (found) foundCount++;

    logger.debug(
      "Organisme with UAI",
      organismeParsedFromFile.uai,
      "and Siret",
      organismeParsedFromFile.siret,
      found ? "found" : "not found",
      found && !foundUnique ? "multiple times" : ""
    );

    // if only one result, we compare reseaux between organisme in réseau file and the one we found in our database
    // and update our organisme with the updated list of reseaux
    if (foundUnique) {
      foundUniqueCount++;
      const uniqueOrganismeFromTdb: WithId<any> = organismeInTdb[0];

      const reseauxFromDb = uniqueOrganismeFromTdb.reseaux || [];
      const reseauxFromFile = organismeParsedFromFile.reseaux || [];

      if (!arraysContainSameValues(reseauxFromDb, reseauxFromFile)) {
        logger.info(
          "Organisme with UAI",
          uniqueOrganismeFromTdb.uai,
          "and SIRET",
          organismeParsedFromFile.siret,
          "will be updated with list of reseaux",
          reseauxFromFile.join(", ")
        );
        try {
          const reseauxToUpdate = [...reseauxFromDb, ...reseauxFromFile];
          await organismesDb().updateOne(
            { _id: uniqueOrganismeFromTdb._id },
            {
              // we merge reseaux from db and file, in case an organism has several "reseaux"
              $addToSet: {
                // https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/#value-to-add-is-an-array
                reseaux: { $each: reseauxToUpdate },
              },
            }
          );

          organismeUpdatedCount++;
        } catch (err) {
          organismeUpdateErrorCount++;
          logger.error(err);
        }
      }
    }
  });

  logger.info("Organismes du fichier", filename, "trouvés en base TDB", foundCount, "/", reseauFile.length);
  logger.info(
    "Organismes du ficher",
    filename,
    "trouvés uniques en base TDB",
    foundUniqueCount,
    "/",
    reseauFile.length
  );
  logger.info("Organismes en base TDB dont les réseaux ont été mis à jour :", organismeUpdatedCount);
  logger.info("Organismes en base TDB n'ont pas pu être mis à jour :", organismeUpdateErrorCount);
};
