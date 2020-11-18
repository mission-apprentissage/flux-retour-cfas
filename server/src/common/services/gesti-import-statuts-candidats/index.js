const config = require("config");
const path = require("path");
const { move, writeFile } = require("fs-extra");

const logger = require("../../logger");
const { readJsonFromCsvFile } = require("../../utils/fileUtils");
const { adaptGestiStatutCandidat, validateInput } = require("./utils");
const computeStatsForStatutsCandidats = require("./stats");
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
    if (inputValidationErrors.length > 0) {
      logger.warn(
        `${inputValidationErrors.length} invalid lines will be skipped (check the generated report for details)`
      );
    }
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

    // we will use this timestamp to id the processed file and report
    const importId = Date.now();

    await this.createReport(
      { inputValidationErrors, csvStats: computeStatsForStatutsCandidats(validStatutsCandidat) },
      importId
    );

    // move file to user /processed folder
    const processedFolderPath = path.join(ftp().getHome(config.users.gesti.name), "processed");
    try {
      const processedFilePath = path.join(processedFolderPath, `processed_${importId}.csv`);
      await move(inputFilePath, processedFilePath);
    } catch (err) {
      logger.error(err);
      logger.error(`Could not move ${inputFilePath} to ${processedFolderPath}`);
    }

    logger.info("Gesti statut-candidats import completed");
  }

  async createReport(report, reportId) {
    const processedFolderPath = path.join(ftp().getHome(config.users.gesti.name), "processed");
    try {
      const reportFilePath = path.join(processedFolderPath, `report_${reportId}.json`);
      await writeFile(reportFilePath, JSON.stringify(report));
    } catch (err) {
      logger.error(err);
      logger.error(`Could not create report in ${processedFolderPath}`);
    }
  }
}

module.exports = GestiImportStatutsCandidatsService;
