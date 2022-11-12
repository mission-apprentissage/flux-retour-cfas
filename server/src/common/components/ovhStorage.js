import config from "../../../config";
import OvhStorage from "node-ovh-objectstorage";
import fs from "fs-extra";
import logger from "../logger";

/**
 * Téléchargement du fichier depuis OVH Storage si nécessaire
 * @param {*} filePath
 * @param {*} fileDestination
 * @param {*} options
 * @returns
 */
const downloadIfNeededFileTo = async (filePath, fileDestination, options = {}) => {
  const clearFile = options.clearFile || false;

  // Connection to OvhStorage
  const storage = new OvhStorage({
    username: config.ovhStorage.username,
    password: config.ovhStorage.password,
    authURL: config.ovhStorage.authURL,
    tenantId: config.ovhStorage.tenantId,
    region: config.ovhStorage.region,
  });
  await storage.connection();

  // Clearing file option
  if (clearFile === true && fs.existsSync(fileDestination)) {
    logger.info(`File ${fileDestination} already present - deleting it.`);
    fs.removeSync(fileDestination);
  }
  if (!fs.existsSync(fileDestination)) {
    if (!(await storage.containers().exist(config.ovhStorage.containerName))) {
      return null;
    }
    await storage.objects().download(`${config.ovhStorage.containerName}/${filePath}`, fileDestination);
  } else {
    logger.info(`File ${fileDestination} already present.`);
  }
};

export default () => ({ downloadIfNeededFileTo });
