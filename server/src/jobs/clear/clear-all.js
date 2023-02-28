import { clearAllCollections, clearCollection } from "../../common/mongodb.js";
import logger from "../../common/logger.js";
import * as RolesModelDescriptor from "../../common/model/roles.model.js";
import * as PermissionsDescriptor from "../../common/model/permissions.model.js";
import * as usersMigrationModelDescriptor from "../../common/model/usersMigration.model.js";

export const clearRoles = async () => {
  await clearCollection(RolesModelDescriptor.collectionName);
  logger.info("Clear roles done !");
};

export const clearUsers = async () => {
  await clearCollection(PermissionsDescriptor.collectionName);
  await clearCollection(usersMigrationModelDescriptor.collectionName);
  logger.info("Clear users done !");
};

export const clear = async ({ clearAll }) => {
  if (clearAll) {
    await clearAllCollections();
    logger.info("Clear flux-retour-cfas done !");
  }
};
