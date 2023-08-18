import { createUserLegacy } from "@/common/actions/legacy/users.legacy.actions";
import logger from "@/common/logger";
import { apiRoles } from "@/common/roles";

/**
 * Fonction de création d'un compte utilisateur
 *
 * @param {Object} options
 * @param {string} options.email - Email
 */
export const createUserAccount = async ({ email }) => {
  logger.info(`Création de l'utilisateur ${email}`);

  throw new Error("non implémenté");
};

/**
 * Fonction de création d'un compte ERP utilisateur via l'ancien modèle
 * @param {*} username
 */
export const createErpUserLegacy = async (username) => {
  await createUserLegacy({
    username,
    permissions: [apiRoles.apiStatutsSeeder],
  });

  logger.info(`User ERP ${username} successfully created`);
};
