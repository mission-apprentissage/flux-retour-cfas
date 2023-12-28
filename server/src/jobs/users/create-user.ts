import { createUserLegacy } from "@/common/actions/legacy/users.legacy.actions";
import logger from "@/common/logger";
import { apiRoles } from "@/common/roles";

/**
 * Fonction de création d'un compte ERP utilisateur via l'ancien modèle
 */
export const createErpUserLegacy = async (username: string) => {
  await createUserLegacy({
    username,
    permissions: [apiRoles.apiStatutsSeeder],
  });

  logger.info(`User ERP ${username} successfully created`);
};
