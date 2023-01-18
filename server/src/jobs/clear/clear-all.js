import { clearAllCollections, clearCollection } from "../../common/mongodb.js";
import logger from "../../common/logger.js";
import * as RolesModelDescriptor from "../../common/model/next.toKeep.models/roles.model.js";
import * as PermissionsDescriptor from "../../common/model/next.toKeep.models/permissions.model.js";
import * as usersMigrationModelDescriptor from "../../common/model/next.toKeep.models/usersMigration.model.js";
import { findOrganismesByQuery, updateOrganisme } from "../../common/actions/organismes/organismes.actions.js";

export const clearRoles = async () => {
  await clearCollection(RolesModelDescriptor.collectionName);
  logger.info(`Clear roles done !`);
};

export const clearUsers = async () => {
  const organismes = await findOrganismesByQuery({ contributeurs: { $ne: [] } });
  for (const organisme of organismes) {
    await updateOrganisme(organisme._id, { ...organisme, contributeurs: [] });
  }
  await clearCollection(PermissionsDescriptor.collectionName);
  await clearCollection(usersMigrationModelDescriptor.collectionName);
  logger.info(`Clear users done !`);
};

export const clear = async ({ clearAll }) => {
  if (clearAll) {
    await clearAllCollections();
    logger.info(`Clear flux-retour-cfas done !`);
  }
};
