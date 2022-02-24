const logger = require("../../../common/logger");
const path = require("path");
const { runScript } = require("../../scriptWrapper");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");
const { jobNames } = require("../../../common/model/constants/index");
const { asyncForEach } = require("../../../common/utils/asyncUtils");

const groupby = require("lodash.groupby");
const { toCsv } = require("../../../common/utils/exporterUtils");
const decaFilePath = path.join(__dirname, `./assets/donnees_deca_2021.csv`);

/**
 * Ce script permet de fusionner la sommes des UAIs dans le fichier DECA
 */
runScript(async ({ ovhStorage }) => {
  logger.info("Merge DECA UAIs File");
  await mergeDecaUaisFile(ovhStorage);
  logger.info("End Merging DECA UAIs File");
}, jobNames.mergeDecaUaisFile);

const mergeDecaUaisFile = async (ovhStorage) => {
  const mergedDecaData = [];

  // Gets the referentiel file
  await ovhStorage.downloadIfNeeded(`deca/donnees_deca_2021.csv`, decaFilePath);

  const decaData = readJsonFromCsvFile(decaFilePath, "utf8");

  if (!decaData) {
    logger.error("Error while reading DECA reference file");
    return;
  } else {
    const decaDataGroupedByUai = groupby(decaData, "uai");
    const groupedByUai = Object.keys(decaDataGroupedByUai).map((k) => decaDataGroupedByUai[k]);

    await asyncForEach(groupedByUai, async (currentUaiGroup) => {
      mergedDecaData.push({
        uai: currentUaiGroup[0].uai,
        nbDoublonsUais: currentUaiGroup.length,
        sirets: currentUaiGroup.map((item) => item.siret).join(";"),
        noms: currentUaiGroup.map((item) => item.nom).join(";"),
        nb_contrats_2019: currentUaiGroup
          .map((item) => item.nb_contrats_2019)
          .reduce((a, b) => Number(a) + Number(b), 0),
        nb_contrats_2020: currentUaiGroup
          .map((item) => item.nb_contrats_2020)
          .reduce((a, b) => Number(a) + Number(b), 0),
        nb_contrats_2021: currentUaiGroup
          .map((item) => item.nb_contrats_2021)
          .reduce((a, b) => Number(a) + Number(b), 0),
      });
    });
  }

  // Build merged export XLSX
  await toCsv(mergedDecaData, path.join(__dirname, `/output/donnees_deca_2021_sommeUais_${Date.now()}.csv`), {
    delimiter: ";",
  });
};
