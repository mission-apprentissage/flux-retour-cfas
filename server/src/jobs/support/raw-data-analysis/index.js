const logger = require("../../../common/logger");
const path = require("path");
const arg = require("arg");
const { runScript } = require("../../scriptWrapper");
const { jobNames } = require("../../../common/model/constants/index");
const { UserEvent } = require("../../../common/model");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { toCsv } = require("../../../common/utils/exporterUtils");

let args = [];

/**
 * Ce script permet d'effectuer une analyse des données brutes recues (UserEvents) pour un ou plusieurs critères
 */
runScript(async () => {
  logger.info("Analyse des données brutes reçues (UserEvents) ...");
  args = arg({ "--uai": String, "--date": String }, { argv: process.argv.slice(2) });
  if (!args["--uai"]) throw new Error("missing required argument: --uai");
  await analysisRawData(args["--uai"], args["--date"]);
  logger.info("Fin de l'analyse des données ...");
}, jobNames.rawUserEventsAnalysis);

/**
 * Exec analysis
 * @param {*} matchDataQuery
 */
const analysisRawData = async (uaiToCheck, dateToCheck) => {
  logger.info(`Analyse en cours pour l'UAI ${uaiToCheck} ...`);

  const searchDate = await getSearchDate(uaiToCheck, dateToCheck);
  logger.info(`Recherche des données pour le ${searchDate.toLocaleDateString("fr-FR")}`);

  const rawDataForLastDay = (
    await UserEvent.aggregate([
      {
        $match: {
          data: { $elemMatch: { uai_etablissement: uaiToCheck } },
          date: { $gte: searchDate },
        },
      },
      { $project: { data: 1, date: 1 } },
      { $sort: { date: -1 } },
    ])
      .allowDiskUse(true)
      .exec()
  )
    .map((item) => item.data)
    .flat();

  const rawDataForUaiLastDay = rawDataForLastDay.filter((item) => item.uai_etablissement === uaiToCheck);

  // Display analysis total
  logger.info(`Nombre de statuts total reçus : ${rawDataForUaiLastDay.length}`);

  if (rawDataForUaiLastDay.length > 0) {
    // Display analysis annee_scolaire
    logger.info(`--- Année Scolaire ---`);
    const statutsWithoutAnneeScolaire = rawDataForUaiLastDay.filter((item) => item["annee_scolaire"] === undefined);
    logger.info(`Sans annee_scolaire : ${statutsWithoutAnneeScolaire.length} statuts`);

    const distinctAnneeScolaire = [...new Set(rawDataForUaiLastDay.map((item) => item.annee_scolaire))];
    await asyncForEach(distinctAnneeScolaire, async (currentAnnee) => {
      const statutsForAnnee = rawDataForUaiLastDay.filter((item) => item.annee_scolaire === currentAnnee);
      logger.info(`Annee_scolaire [${currentAnnee}] : ${statutsForAnnee.length} statuts `);
    });
    logger.info(`-----------------`);

    // Display analysis id_formation
    logger.info(`--- Id Formation ---`);
    const statutsWithoutAnneeFormation = rawDataForUaiLastDay.filter((item) => item["annee_formation"] === undefined);
    logger.info(`Sans annee_formation : ${statutsWithoutAnneeFormation.length} statuts`);

    const distinctIdFormation = [...new Set(rawDataForUaiLastDay.map((item) => item.id_formation))];

    await asyncForEach(distinctIdFormation, async (currentFormation) => {
      const statutsForFormation = rawDataForUaiLastDay.filter((item) => item.id_formation === currentFormation);
      logger.info(`Id_formation [${currentFormation}] / ${statutsForFormation.length} statuts `);

      const distinctAnneeFormationForFormation = [...new Set(statutsForFormation.map((item) => item.annee_formation))];
      await asyncForEach(distinctAnneeFormationForFormation, async (currentAnneeFormation) => {
        const statutsForFormationAndAnneeFormation = statutsForFormation.filter(
          (item) => item.annee_formation === currentAnneeFormation
        );
        logger.info(
          `  > Id_formation [${currentFormation}] - Annee_formation [${currentAnneeFormation}] : ${statutsForFormationAndAnneeFormation.length} statuts`
        );
      });
    });
    logger.info(`-----------------`);

    // Export to csv
    await toCsv(rawDataForUaiLastDay, path.join(__dirname, `/output/rawData_uai_${uaiToCheck}_${Date.now()}.csv`), {
      delimiter: ";",
    });
  }
};

/**
 * Handle date
 * @param {*} uaiToCheck
 * @param {*} dateToCheck
 * @returns
 */
const getSearchDate = async (uaiToCheck, dateToCheck) => {
  if (!dateToCheck) {
    const lastDataFromUserEvent = (
      await UserEvent.aggregate([
        { $match: { data: { $elemMatch: { uai_etablissement: uaiToCheck } } } },
        { $project: { date: 1 } },
        { $sort: { date: -1 } },
        { $limit: 1 },
      ])
        .allowDiskUse(true)
        .exec()
    ).map((item) => item.date);

    const searchDate = new Date(lastDataFromUserEvent[0].setHours(0, 0, 0, 0));
    logger.info(`Calcul de la dernière date de transmission : ${searchDate.toLocaleDateString("fr-FR")}`);
    return searchDate;
  }

  return new Date(dateToCheck);
};
