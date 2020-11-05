const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const path = require("path");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { adaptGestiStatutCandidat, validateInput } = require("./utils");

const INPUT_FILE_PATH = path.join(__dirname, "/data/gesti-input.csv");
const ELEMENTS_PER_INSERT_BATCH_PAGE = 1000;

runScript(async ({ statutsCandidats }) => {
  logger.info("Importing Gesti data for statut-candidat...");

  // read data from csv file
  let gestiCsv;
  try {
    gestiCsv = readJsonFromCsvFile(INPUT_FILE_PATH);
  } catch (err) {
    logger.error(`Problem while reading input file at path ${INPUT_FILE_PATH}`, err);
  }

  // adapt parsed json from csv to expected StatutCandidat shape
  const adaptedStatutsCandidats = gestiCsv.map(adaptGestiStatutCandidat);

  // validate data, skip invalid
  const { valid: validStatutsCandidat, errors: inputValidationErrors } = validateInput(adaptedStatutsCandidats);

  // insert or update in db
  logger.info(`Will import ${validStatutsCandidat.length} valid statuts candidats in db`);
  // we import data by batches of 1000 elements
  const pages = validStatutsCandidat.length / ELEMENTS_PER_INSERT_BATCH_PAGE;
  for (let i = 0; i < pages; i++) {
    const firstElementIndex = i * ELEMENTS_PER_INSERT_BATCH_PAGE;
    // no need to slice further than the list's length
    const lastElementIndex = Math.min(firstElementIndex + ELEMENTS_PER_INSERT_BATCH_PAGE, validStatutsCandidat.length);

    const sliced = validStatutsCandidat.slice(firstElementIndex, lastElementIndex);
    logger.info(
      `Inserting statuts candidats with index in [${firstElementIndex}, ${lastElementIndex - 1}]: ${
        sliced.length
      } statuts candidats`
    );
    try {
      await statutsCandidats.addOrUpdateStatuts(sliced);
    } catch (err) {
      logger.error(`Error while importing elements [${firstElementIndex}, ${lastElementIndex - 1}] in Mongo`);
      logger.error(err);
    }
  }

  if (inputValidationErrors > 0) {
    logger.warn(`${inputValidationErrors} invalid lines were not imported`);
  }
  logger.info("Import completed");
});
