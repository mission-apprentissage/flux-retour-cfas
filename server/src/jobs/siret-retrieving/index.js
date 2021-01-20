const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const ovhStorageManager = require("../../common/utils/ovhStorageManager");
const path = require("path");
const fs = require("fs-extra");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { StatutCandidat } = require("../../common/model");

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

  // Gets the referentiel file
  await downloadIfNeeded(`siret-erps/sirets-gesti.csv`, siretGestiReferenceFilePath);

  // Parse all data for gesti with siret_etablissement null & uai not null
  const statutsWithoutSiretsWithUais = await StatutCandidat.find({
    source: "gesti",
    $and: [{ siret_etablissement: null }, { uai_etablissement: { $ne: null } }],
  });

  await asyncForEach(statutsWithoutSiretsWithUais, async (currentStatutWithoutSiret) => {
    const siretFound = findSiretForUai(currentStatutWithoutSiret.uai_etablissement);
    logger.info(siretFound);
  });
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

const findSiretForUai = (uai, filepath) => {
  const jsonData = readJsonFromCsvFile(__dirname + filepath);
  logger.info(jsonData);
  return "123";
};
