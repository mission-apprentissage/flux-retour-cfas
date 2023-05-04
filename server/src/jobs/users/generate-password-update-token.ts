import Logger from "bunyan";

import { generatePasswordUpdateTokenLegacy } from "@/common/actions/legacy/users.legacy.actions";
import { generatePasswordUpdateToken } from "@/common/actions/users.actions";
import config from "@/config";

/**
 *
 * @param {*} email
 */
export const generatePasswordUpdateTokenForUser = async (logger: Logger, email: string) => {
  logger.info(`Génération d'un lien de MAJ de mot de passe pour ${email}`);
  const token = await generatePasswordUpdateToken(email);

  logger.info(`Token pour ${email} créé avec succès -> ${token}`);
  // TODO Update when parcours UI finished & good route
  logger.info(`Lien de changement de mot de passe -> ${config.publicUrl}/modifier-mot-de-passe?token=${token}`);
};

/**
 *
 * @param {*} username
 */
export const generatePasswordUpdateTokenForUserLegacy = async (logger: Logger, username: string) => {
  logger.info(`Génération d'un lien de MAJ de mot de passe pour un ancien user ${username}`);
  const token = await generatePasswordUpdateTokenLegacy(username);
  logger.info(`Token pour ${username} créé avec succès -> ${token}`);
};
