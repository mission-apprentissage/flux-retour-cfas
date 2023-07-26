import path from "path";

import { PromisePool } from "@supercharge/promise-pool";

import { findOrganismesBySiret } from "@/common/actions/organismes/organismes.actions";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";
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
  "assets/referentiel-reseau-cfa-ec.csv", // CFA EC
];

/**
 * Parse des réseaux depuis le csv
 * @param  {string} reseauText
 */
const parseReseauxTextFromCsv = (reseauText: string): string[] => {
  if (!reseauText || RESEAU_NULL_VALUES.includes(reseauText)) return [];
  return reseauText.split(RESEAUX_LIST_SEPARATOR).map((reseau) => reseau.toUpperCase().trim());
};

/**
 * Fonction de transformation d'une ligne en objet organisme
 * @param {*} organismeFromFile
 * @returns
 */
const mapFileOrganisme = (organismeFromFile: any) => {
  return {
    siret: organismeFromFile[INPUT_FILE_COLUMN_NAMES.SIRET],
    uai: organismeFromFile[INPUT_FILE_COLUMN_NAMES.UAI] || undefined,
    reseaux: parseReseauxTextFromCsv(organismeFromFile[INPUT_FILE_COLUMN_NAMES.RESEAUX_A_JOUR]),
  };
};

/**
 * Fonction de remise à zero des réseaux dans la collection organismes
 */
const clearReseauxInOrganismes = async () => {
  logger.info("Remise à zero des réseaux pour tous les organismes...");
  await organismesDb().updateMany({ siret: { $exists: true } }, { $set: { reseaux: [] } });
};

/**
 * Fonction de remplissage des réseaux
 */
export const hydrateReseaux = async () => {
  await clearReseauxInOrganismes();

  let reseauxStats: any = [];

  await PromisePool.for(INPUT_FILES).process(async (currentReseauFile) => {
    const currentReseauStats = await hydrateReseauFile(currentReseauFile);
    reseauxStats.push(currentReseauStats);
  });

  return reseauxStats;
};

/**
 * Fonction de remplissage des données d'un fichier réseau
 */
const hydrateReseauFile = async (filename: string) => {
  logger.info(`Import des données réseaux de ${filename}`);

  // Lecture du fichier de référence + conversion JSON
  const filePath = path.join(__dirname(import.meta.url), filename);
  const reseauFile = readJsonFromCsvFile(filePath, ";");

  // init des compteurs
  let organismesFound: Array<{ uai: string; siret: string }> = [];
  let organismesNotFound: Array<{ uai: string; siret: string }> = [];
  let organismeUpdatedCount = 0;
  let organismeUpdateErrorCount = 0;

  logger.info(reseauFile.length, "lignes dans le fichier", filename);
  if (reseauFile.length === 0) throw new Error(`Le fichier ${filename} est vide`);

  await PromisePool.for(reseauFile).process(async (reseauFileLine) => {
    const organismeFromFile = mapFileOrganisme(reseauFileLine);

    // Recherche des organismes présents dans le référentiel et ayant ce siret
    const organismesForSiret = await findOrganismesBySiret(organismeFromFile.siret, {
      est_dans_le_referentiel: true,
    });

    const found = organismesForSiret?.length !== 0;

    if (found) {
      organismesFound.push({ uai: organismeFromFile.uai, siret: organismeFromFile.siret });
      logger.debug(`${organismesForSiret.length} organismes trouvés pour le SIRET ${organismeFromFile.siret}`);

      await PromisePool.for(organismesForSiret).process(async (currentOrganismeFound) => {
        const reseauxFromDb = currentOrganismeFound.reseaux || [];
        const reseauxFromFile = organismeFromFile.reseaux || [];

        if (!arraysContainSameValues(reseauxFromDb, reseauxFromFile)) {
          logger.debug(`Mise à jour de l'organisme ${organismeFromFile.siret} avec : ${reseauxFromFile.join(", ")}`);
          try {
            const reseauxToUpdate = [...reseauxFromDb, ...reseauxFromFile];
            await organismesDb().updateOne(
              { _id: currentOrganismeFound._id },
              {
                // Fusion des réseaux dans le cas d'un organisme multi réseaux
                // https://www.mongodb.com/docs/manual/reference/operator/update/addToSet/#value-to-add-is-an-array
                $addToSet: { reseaux: { $each: reseauxToUpdate } },
              }
            );

            organismeUpdatedCount++;
          } catch (err) {
            logger.error(
              `Erreur pour le fichier ${filename} lors de la mise à jour de l'organisme SIRET : ${
                organismeFromFile.siret
              } - UAI : ${organismeFromFile.uai} pour les réseaux : ${JSON.stringify(reseauxFromFile)}`
            );
            organismeUpdateErrorCount++;
            logger.error(err);
          }
        }
      });
    } else {
      organismesNotFound.push({ uai: organismeFromFile.uai, siret: organismeFromFile.siret });
      logger.debug(`Aucun organisme trouvé pour le SIRET ${organismeFromFile.siret}`);
    }
  });

  logger.info(`Organismes de ${filename} trouvés en base ${organismesFound.length} sur ${reseauFile.length}`);
  logger.info(`Organismes de ${filename} non trouvés en base ${organismesNotFound.length} sur ${reseauFile.length}`);
  if (organismesNotFound.length > 0) logger.info(`Organismes non trouvés : ${JSON.stringify(organismesNotFound)}`);
  logger.info("Organismes en base TDB dont les réseaux ont été mis à jour :", organismeUpdatedCount);
  logger.info("Organismes en base TDB n'ont pas pu être mis à jour :", organismeUpdateErrorCount);

  return {
    filename,
    stats: {
      reseauFileLength: reseauFile.length,
      nbOrganismesFound: organismesFound.length,
      nbOrganismesNotFound: organismesNotFound.length,
      organismesNotFound,
      organismeUpdatedCount,
      organismeUpdateErrorCount,
    },
  };
};
