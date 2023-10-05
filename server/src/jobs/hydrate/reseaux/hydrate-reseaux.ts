import { PromisePool } from "@supercharge/promise-pool";

import { STATUT_PRESENCE_REFERENTIEL } from "@/common/constants/organisme";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";
import { __dirname } from "@/common/utils/esmUtils";
import { readJsonFromCsvFile } from "@/common/utils/fileUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";
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
  const filePath = getStaticFilePath(filename);
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

    try {
      // Recherche des organismes présents dans le référentiel et ayant ce siret
      const organismesForSiret = await organismesDb()
        .find({ siret: organismeFromFile.siret, est_dans_le_referentiel: { $ne: STATUT_PRESENCE_REFERENTIEL.ABSENT } })
        .toArray();

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
    } catch (err) {
      logger.error(err);
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
