const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");

const INPUT_FILE_COLUMN_NAMES = {
  SIRET: "Siret",
  UAI: "UAIvalidée",
  RESEAUX_A_JOUR: "Réseauxàjour",
};

const RESEAUX_LIST_SEPARATOR = "|";

const RESEAU_NULL_VALUES = ["Hors réseau CFA EC", "", null];

const INPUT_FILES = ["referentiel-reseau-excellence-pro.csv", "referentiel-reseau-greta-pdl.csv"];

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

runScript(async ({ cfas }) => {
  await asyncForEach(INPUT_FILES, async (filename) => {
    logger.info("Importing data from", filename);
    // read référentiel file from réseau and convert it to JSON
    const filePath = path.join(__dirname, filename);
    const reseauReferentielFileJson = readJsonFromCsvFile(filePath, ";");

    // init counters for final log
    let foundCount = 0;
    let foundUniqueCount = 0;
    let organismeUpdatedCount = 0;
    let organismeUpdateErrorCount = 0;

    logger.info(reseauReferentielFileJson.length, "lines in", filename);
    // iterate over every line (organisme de formation) in the référentiel file
    await asyncForEach(reseauReferentielFileJson, async (reseauReferentielFileJsonLine) => {
      const organismeParsedFromFile = {
        siret: reseauReferentielFileJsonLine[INPUT_FILE_COLUMN_NAMES.SIRET],
        uai: reseauReferentielFileJsonLine[INPUT_FILE_COLUMN_NAMES.UAI],
        reseaux: parseReseauxTextFromCsv(reseauReferentielFileJsonLine[INPUT_FILE_COLUMN_NAMES.RESEAUX_A_JOUR]),
      };

      // try to retrieve organisme in our database with UAI and SIRET if UAI is provided
      const organismeInTdb = organismeParsedFromFile.uai
        ? await cfas.getFromUaiAndSiret(organismeParsedFromFile.uai, organismeParsedFromFile.siret)
        : await cfas.getFromSiret(organismeParsedFromFile.siret);

      const found = organismeInTdb.length !== 0;
      const foundUnique = found && organismeInTdb.length === 1;

      if (found) foundCount++;

      // if only one result, we compare reseaux between organisme in réseau file référentiel and the one we found in our database
      // and update our organisme with the updated list of reseaux
      if (foundUnique) {
        foundUniqueCount++;
        const uniqueOrganismeFromTdb = organismeInTdb[0];

        const reseauxFromDb = uniqueOrganismeFromTdb.reseaux || [];
        const reseauxFromReferentiel = organismeParsedFromFile.reseaux || [];

        if (!arraysContainSameValues(reseauxFromDb, reseauxFromReferentiel)) {
          logger.info(
            "Organisme with UAI",
            uniqueOrganismeFromTdb.uai,
            "and SIRET",
            organismeParsedFromFile.siret,
            "will be updated with list of reseaux",
            reseauxFromReferentiel.join(", ")
          );
          try {
            await cfas.updateCfaReseauxFromUai(uniqueOrganismeFromTdb.uai, reseauxFromReferentiel);
            organismeUpdatedCount++;
          } catch (err) {
            organismeUpdateErrorCount++;
            logger.error(err);
          }
        }
      }
    });
    logger.info(
      "Organismes du fichier",
      filename,
      "trouvés en base",
      foundCount,
      "/",
      reseauReferentielFileJson.length
    );
    logger.info(
      "Organismes du ficher",
      filename,
      "trouvés uniques en base",
      foundUniqueCount,
      "/",
      reseauReferentielFileJson.length
    );
    logger.info("Organismes en base dont les réseaux ont été mis à jour :", organismeUpdatedCount);
    logger.info("Organismes en base n'ont pas pu être mis à jour :", organismeUpdateErrorCount);
  });
}, "seed-reseaux-for-cfas");
