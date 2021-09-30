const config = require("../../../config");
const OvhStorage = require("node-ovh-objectstorage");

let storage = null;

module.exports = async () => {
  const storageConfig = {
    username: config.ovhStorage.username,
    password: config.ovhStorage.password,
    authURL: config.ovhStorage.authURL,
    tenantId: config.ovhStorage.tenantId,
    region: config.ovhStorage.region,
  };

  storage = new OvhStorage(storageConfig);
  await storage.connection();

  return {
    containerExists: async () => {
      return await storage.containers().exist(config.ovhStorage.containerName);
    },
    listFiles: async () => {
      if (!(await storage.containers().exist(config.ovhStorage.containerName))) {
        return [];
      }
      return await storage.containers().list(config.ovhStorage.containerName);
    },
    getFileContent: async (filePath) => {
      if (!(await storage.containers().exist(config.ovhStorage.containerName))) {
        return null;
      }
      return await storage.objects().get(`${config.ovhStorage.containerName}/${filePath}`);
    },
    downloadFileTo: async (filePath, fileDestination) => {
      if (!(await storage.containers().exist(config.ovhStorage.containerName))) {
        return null;
      }
      await storage.objects().download(`${config.ovhStorage.containerName}/${filePath}`, fileDestination);
    },
    uploadFileTo: async (file, path) => {
      if (!(await storage.containers().exist(config.ovhStorage.containerName))) {
        return null;
      }
      await storage.objects().save_with_result(file, `${config.ovhStorage.containerName}/${path}`);
    },
  };
};
