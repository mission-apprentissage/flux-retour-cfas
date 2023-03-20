import { clearAllCollections, clearCollection } from "../../common/mongodb.js";
import logger from "../../common/logger.js";
import * as usersMigrationModelDescriptor from "../../common/model/usersMigration.model.js";

export const clearUsers = async () => {
  await clearCollection(usersMigrationModelDescriptor.collectionName);
  logger.info("Clear users done !");
};

export const clear = async ({ clearAll }) => {
  if (clearAll) {
    await clearAllCollections();
    logger.info("Clear flux-retour-cfas done !");
  }
};
