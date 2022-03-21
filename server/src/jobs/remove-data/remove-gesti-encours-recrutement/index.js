const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const path = require("path");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { DossierApprenantModel } = require("../../../common/model");

const statutsGestiToRemoveFilePath = path.join(__dirname, `./assets/statuts-gesti-encours-recrutement-toRemove.csv`);

/**
 * Ce script permet de supprimer les statuts en cours de recrutement fournis par GESTI
 * Ces statuts n'ont pas vocation a être stockés
 * Ces statuts ont été identifiés dans un CSV fourni par GESTI
 */
runScript(async ({ ovhStorage }) => {
  logger.info("Start Remove Gesti En cours de recrutement");

  // Gets the reference file & data
  await ovhStorage.downloadIfNeededFileTo(
    `gesti/statuts-gesti-encours-recrutement-toRemove.csv`,
    statutsGestiToRemoveFilePath
  );
  const toRemoveData = readJsonFromCsvFile(statutsGestiToRemoveFilePath, "utf8");

  let totalDeletedCount = 0;

  if (!toRemoveData) {
    logger.error("Error while reading reference file");
    return;
  } else {
    await asyncForEach(toRemoveData, async (currentStatutToRemove) => {
      const { deletedCount } = await DossierApprenantModel.deleteOne({
        id_erp_apprenant: currentStatutToRemove.id_erp_apprenant,
        uai_etablissement: currentStatutToRemove.uai_etablissement,
        source: "gesti",
      });

      totalDeletedCount += deletedCount;
    });
  }
  logger.info(`${totalDeletedCount} statuts deleted !`);
  logger.info("End Remove Gesti en cours de recrutement");
}, "Remove Statuts GESTI en cours de recrutement");
