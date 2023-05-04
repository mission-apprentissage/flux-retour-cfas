import Logger from "bunyan";

import * as usersMigrationModelDescriptor from "@/common/model/usersMigration.model";
import { clearAllCollections, clearCollection } from "@/common/mongodb";

export const clearUsers = async (logger: Logger) => {
  await clearCollection(usersMigrationModelDescriptor.collectionName);
  logger.info("Clear users done !");
};

export const clear = async (logger: Logger, { clearAll }) => {
  if (clearAll) {
    await clearAllCollections();
    logger.info("Clear flux-retour-cfas done !");
  }
};
