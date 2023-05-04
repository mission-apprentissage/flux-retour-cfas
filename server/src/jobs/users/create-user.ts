import Logger from "bunyan";

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
  // await createUser(
  //   { email, password: generateRandomAlphanumericPhrase(80) },
  //   {
  //     nom,
  //     prenom,
  //     is_admin,
  //     is_cross_organismes,
  //     account_status: "PENDING_PASSWORD_SETUP",
  //   }
  // );
  // logger.info(`User ${email} successfully created`);

  // return { email };
};

/**
 * Fonction de création d'un compte ERP utilisateur via l'ancien modèle
 * @param {*} username
 */
export const createErpUserLegacy = async (logger: Logger, username: string) => {
  await createUserLegacy({
    username,
    permissions: [apiRoles.apiStatutsSeeder],
  });

  logger.info(`User ERP ${username} successfully created`);
};
