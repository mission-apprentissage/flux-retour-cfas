const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const ovhStorageManager = require("../../common/utils/ovhStorageManager");
const path = require("path");
const fs = require("fs-extra");

const siretGestiReferenceFilePath = path.join(__dirname, `./assets/sirets-gesti.csv`);
const siretYmagReferenceFilePath = path.join(__dirname, `./assets/sirets-ymag.csv`);

/* Ce script permet de récupérer les SIRET pour les données n'ayant aucun siret présent */
runScript(async () => {
  logger.info("Run Siret Retrieving Job");

  await retrieveSiretForGesti();
  await retrieveSiretForYmag();

  logger.info("End Siret Retrieving Job");
});

const retrieveSiretForGesti = async () => {
  logger.info("Retrieving sirets for Gesti");
  await downloadIfNeeded(`siret-erps/sirets-gesti.csv`, siretGestiReferenceFilePath);
};

const retrieveSiretForYmag = async () => {
  logger.info("Retrieving sirets for YMag");
  await downloadIfNeeded(`siret-erps/sirets-ymag.csv`, siretYmagReferenceFilePath);
};

/**
 * Télécharge le fichier depuis OvhStorage si non présent
 * @param {*} downloadDestinationFilePath
 * @param {*} referenceFilePath
 */
const downloadIfNeeded = async (downloadDestinationFilePath, referenceFilePath) => {
  if (!fs.existsSync(referenceFilePath)) {
    const storageMgr = await ovhStorageManager();
    await storageMgr.downloadFileTo(downloadDestinationFilePath, referenceFilePath);
  } else {
    logger.info(`File ${referenceFilePath} already present.`);
  }
};
