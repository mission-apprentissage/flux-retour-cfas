import logger from "../../../common/logger.js";
import path from "path";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { readJsonFromCsvFile } from "../../../common/utils/fileUtils.js";
import { __dirname } from "../../../common/utils/esmUtils.js";

const INPUT_FILE_COLUMN_NAMES = {
  SIRET: "Siret",
  UAI: "UAIvalidée",
  RESEAUX_A_JOUR: "Réseauxàjour",
};

const RESEAUX_LIST_SEPARATOR = "|";

const RESEAU_NULL_VALUES = ["Hors réseau CFA EC", "", null];

const INPUT_FILES = ["assets/referentiel-reseau-excellence-pro.csv", "assets/referentiel-reseau-greta-pdl.csv"];

/**
 * @param  {string} reseauText
 * @returns {[string]} List of parsed réseaux
 */
const parseReseauxTextFromCsv = (reseauText) => {
  if (!reseauText || RESEAU_NULL_VALUES.includes(reseauText)) {
    return [];
  }
  const reseaux = reseauText.split(RESEAUX_LIST_SEPARATOR).map((reseau) => reseau.toUpperCase());
  return reseaux;
};
/**
 * @param  {[any]} array1
 * @param  {[any]} array2
 * @returns  {boolean}
 */
const arraysContainSameValues = (array1, array2) => {
  if (!Array.isArray(array1) || !Array.isArray(array2) || array1.length !== array2.length) {
    return false;
  }

  array1.forEach((item) => {
    if (!array2.includes(item)) return false;
  });
  return true;
};

const mapFileOrganisme = (organismeFromFile) => {
  return {
    siret: organismeFromFile[INPUT_FILE_COLUMN_NAMES.SIRET],
    uai: organismeFromFile[INPUT_FILE_COLUMN_NAMES.UAI],
    reseaux: parseReseauxTextFromCsv(organismeFromFile[INPUT_FILE_COLUMN_NAMES.RESEAUX_A_JOUR]),
  };
};

export const hydrateReseauxNewFormat = async () => {
  await asyncForEach(INPUT_FILES, async (filename) => {
    logger.info("Importing data from", filename);
    // read référentiel file from réseau and convert it to JSON
    const filePath = path.join(__dirname(import.meta.url), filename);
    const reseauFile = readJsonFromCsvFile(filePath, ";");

    // init counters for final log
    let foundCount = 0;
    let foundUniqueCount = 0;
    let organismeUpdatedCount = 0;
    let organismeUpdateErrorCount = 0;

    logger.info(reseauFile.length, "lines in", filename);
    // iterate over every line (organisme de formation) in the réseau file
    await asyncForEach(reseauFile, async (reseauFileLine) => {
      const organismeParsedFromFile = mapFileOrganisme(reseauFileLine);

      /*
        1 - Add réseau information to organisme in TDB, if found unique
      */
      // try to retrieve organisme in our database with UAI and SIRET if UAI is provided
      const organismeInTdb = organismeParsedFromFile.uai
        ? await cfas.getFromUaiAndSiret(organismeParsedFromFile.uai, organismeParsedFromFile.siret)
        : await cfas.getFromSiret(organismeParsedFromFile.siret);

      const found = organismeInTdb.length !== 0;
      const foundUnique = found && organismeInTdb.length === 1;

      if (found) foundCount++;

      // if only one result, we compare reseaux between organisme in réseau file and the one we found in our database
      // and update our organisme with the updated list of reseaux
      if (foundUnique) {
        foundUniqueCount++;
        const uniqueOrganismeFromTdb = organismeInTdb[0];

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
            await cfas.updateCfaReseauxFromUai(uniqueOrganismeFromTdb.uai, reseauxFromFile);
            organismeUpdatedCount++;
          } catch (err) {
            organismeUpdateErrorCount++;
            logger.error(err);
          }
        }
      }

      /*
        2 - Add réseau information to organisme in Référentiel SIRET-UAI, if found
      */
      const organismeInReferentielSiretUai = await db
        .collection("referentielSiret")
        .findOne({ siret: organismeParsedFromFile.siret });
      if (organismeInReferentielSiretUai && organismeParsedFromFile?.reseaux.length !== 0) {
        await db
          .collection("referentielSiret")
          .updateOne(
            { siret: organismeInReferentielSiretUai.siret },
            { $set: { reseaux: organismeParsedFromFile.reseaux } }
          );
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
  });
};
