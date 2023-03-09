import { createUser } from "../../common/actions/users.actions.js";
import { createUserLegacy } from "../../common/actions/legacy/users.legacy.actions.js";
import { USER_ACCOUNT_STATUS } from "../../common/constants/usersConstants.js";
import logger from "../../common/logger.js";
import { apiRoles } from "../../common/roles.js";
import { generateRandomAlphanumericPhrase } from "../../common/utils/miscUtils.js";

/**
 * Fonction de création d'un compte utilisateur
 * @param {*} param0
 */
export const createUserAccount = async ({ email, nom, prenom, permissions = {} }) => {
  logger.info(`Création de l'utilisateur ${email}`);

  await createUser(
    { email, password: generateRandomAlphanumericPhrase(80) },
    {
      nom,
      prenom,
      permissions,
      account_status: USER_ACCOUNT_STATUS.FIRST_FORCE_RESET_PASSWORD,
    }
  );
  logger.info(`User ${email} successfully created`);

  return { email };
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
