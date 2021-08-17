const fs = require("fs-extra");
const ovhStorageManager = require("../../../common/utils/ovhStorageManager");
const logger = require("../../../common/logger");

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

module.exports = {
  downloadIfNeeded,
};
