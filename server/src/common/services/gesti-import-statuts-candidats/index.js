const config = require("config");
const path = require("path");
const { move } = require("fs-extra");

const logger = require("../../logger");
const { readJsonFromCsvFile } = require("../../utils/fileUtils");
const { adaptGestiStatutCandidat, validateInput } = require("./utils");
const ftp = require("../../ftp");

const ELEMENTS_PER_INSERT_BATCH_PAGE = 1000;

class GestiImportStatutsCandidatsService {
  constructor(statutsCandidats) {
    this.statutsCandidats = statutsCandidats;
  }

  async importCsvStatutsCandidats(inputFilePath) {
    logger.info("Importing Gesti data for statut-candidats...");

    // read data from csv file
    let gestiCsv;
    try {
      gestiCsv = readJsonFromCsvFile(inputFilePath);
    } catch (err) {
      logger.error(`Problem while reading input file at path ${inputFilePath}`, err);
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
      const lastElementIndex = Math.min(
        firstElementIndex + ELEMENTS_PER_INSERT_BATCH_PAGE,
        validStatutsCandidat.length
      );

      const sliced = validStatutsCandidat.slice(firstElementIndex, lastElementIndex);
      logger.info(
        `Inserting statuts candidats with index in [${firstElementIndex}, ${lastElementIndex - 1}]: ${
          sliced.length
        } statuts candidats`
      );
      try {
        await this.statutsCandidats.addOrUpdateStatuts(sliced);
      } catch (err) {
        logger.error(`Error while importing elements [${firstElementIndex}, ${lastElementIndex - 1}] in Mongo`);
        logger.error(err);
      }
    }

    if (inputValidationErrors > 0) {
      logger.warn(`${inputValidationErrors} invalid lines were not imported`);
    }

    // move file to user /processed folder
    const processedFolderPath = path.join(
      ftp().getHome(config.users.gesti.name),
      `processed/processed_on_${Date.now()}.csv`
    );
    try {
      await move(inputFilePath, processedFolderPath);
    } catch (err) {
      logger.error(err);
      logger.error(`Could not move ${inputFilePath} to ${processedFolderPath}`);
    }
    logger.info("Gesti statut-candidats import completed");
  }
}

module.exports = GestiImportStatutsCandidatsService;
