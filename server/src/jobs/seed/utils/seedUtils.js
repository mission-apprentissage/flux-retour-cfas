const logger = require("../../../common/logger");
const { fullSampleWithUpdates } = require("../../../../tests/data/sample");
const { createRandomStatutsCandidatsList } = require("../../../../tests/data/randomizedSample");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");
const fs = require("fs-extra");
const ovhStorageManager = require("../../../common/utils/ovhStorageManager");

const seedSample = async (statutsCandidats) => {
  await statutsCandidats.addOrUpdateStatuts(fullSampleWithUpdates);
};

const seedRandomizedSample = async (statutsCandidats) => {
  await statutsCandidats.addOrUpdateStatuts(createRandomStatutsCandidatsList());
};

const seedRandomizedSampleWithStatut = async (statutsCandidats, nbStatuts, statutValue) => {
  const randomStatuts = createRandomStatutsCandidatsList(nbStatuts).map((statutCandidat) => {
    return {
      ...statutCandidat,
      statut_apprenant: statutValue,
    };
  });

  await statutsCandidats.addOrUpdateStatuts(randomStatuts);
};

const buildCfasFromCsvAndExcludedFile = async (referenceFilePath, excludedFilePath, encoding) => {
  const allCfasForNetwork = readJsonFromCsvFile(referenceFilePath, encoding);
  const excludedCfas = readJsonFromCsvFile(excludedFilePath, encoding);

  if (excludedCfas.length > 0 && allCfasForNetwork.length > 0) {
    const excludedSirets = excludedCfas.filter((item) => item.siret).map((item) => item.siret);
    return allCfasForNetwork.filter((item) => !excludedSirets.includes(item.siret));
  }

  return [];
};

/**
 * Télécharge le fichier depuis OvhStorage si non présent
 * @param {*} downloadDestinationFilePath
 * @param {*} referenceFilePath
 */
const downloadIfNeeded = async (downloadDestinationFilePath, referenceFilePath, clearFile = false) => {
  if (clearFile === true && fs.existsSync(referenceFilePath)) {
    logger.info(`File ${referenceFilePath} already present - deleting it.`);
    fs.removeSync(referenceFilePath);
  }
  if (!fs.existsSync(referenceFilePath)) {
    const storageMgr = await ovhStorageManager();
    await storageMgr.downloadFileTo(downloadDestinationFilePath, referenceFilePath);
  } else {
    logger.info(`File ${referenceFilePath} already present.`);
  }
};

module.exports = {
  downloadIfNeeded,
  seedSample,
  seedRandomizedSample,
  seedRandomizedSampleWithStatut,
  buildCfasFromCsvAndExcludedFile,
};
