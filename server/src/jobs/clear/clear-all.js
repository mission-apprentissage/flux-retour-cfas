import { clearAllCollections, clearCollection } from "../../common/mongodb.js";
import logger from "../../common/logger.js";
import * as RolesModelDescriptor from "../../common/model/next.toKeep.models/roles.model.js";

export const clearRoles = async () => {
  await clearCollection(RolesModelDescriptor.collectionName);
  logger.info(`Clear roles done !`);
};

export const clear = async ({ clearAll }) => {
  if (clearAll) {
    await clearAllCollections();
    logger.info(`Clear flux-retour-cfas done !`);
  }
};
