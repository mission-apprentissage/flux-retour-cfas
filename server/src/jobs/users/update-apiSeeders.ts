import Logger from "bunyan";

import { usersDb } from "@/common/model/collections";
import { apiRoles } from "@/common/roles";

const activePermission = apiRoles.apiStatutsSeeder;
const inactivePermission = `${apiRoles.apiStatutsSeeder}_INACTIVE`;

export const updateUsersApiSeeders = async (logger: Logger, mode: string) => {
  if (mode === "active") {
    logger.info("Activation de la permission des utilisateurs fournisseurs de données");
    await usersDb().updateMany({ permissions: [inactivePermission] }, { $set: { permissions: [activePermission] } });
  } else if (mode === "inactive") {
    logger.info("Désactivation de la permission des utilisateurs fournisseurs de données");
    await usersDb().updateMany({ permissions: [activePermission] }, { $set: { permissions: [inactivePermission] } });
  }
};
