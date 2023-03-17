import logger from "../../common/logger.js";
import { usersDb } from "../../common/model/collections.js";
import { apiRoles } from "../../common/roles.js";

const activePermission = apiRoles.apiStatutsSeeder;
const inactivePermission = `${apiRoles.apiStatutsSeeder}_INACTIVE`;

export const updateUsersApiSeeders = async (mode) => {
  if (mode === "active") {
    logger.info("Activation de la permission des utilisateurs fournisseurs de données");
    await usersDb().updateMany({ permissions: [inactivePermission] }, { $set: { permissions: [activePermission] } });
  } else if (mode === "inactive") {
    logger.info("Désactivation de la permission des utilisateurs fournisseurs de données");
    await usersDb().updateMany({ permissions: [activePermission] }, { $set: { permissions: [inactivePermission] } });
  }
};
