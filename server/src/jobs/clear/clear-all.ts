import * as usersMigrationModelDescriptor from "shared/models/data/usersMigration.model";

import logger from "@/common/logger";
import { clearAllCollections, clearCollection } from "@/common/mongodb";

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
