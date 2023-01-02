import { generatePasswordUpdateTokenLegacy } from "../../common/actions/legacy/users.legacy.actions.js";
import { generatePasswordUpdateToken } from "../../common/actions/users.actions.js";
import logger from "../../common/logger.js";
import config from "../../config.js";

/**
 *
 * @param {*} param0
 */
export const generatePasswordUpdateTokenForUser = async (email) => {
  logger.info(`Génération d'un lien de MAJ de mot de passe pour ${email}`);
  const token = await generatePasswordUpdateToken(email);

  logger.info(`Token pour ${email} créé avec succès -> ${token}`);
  // TODO Update when parcours UI finished & good route
  logger.info(`Lien de changement de mot de passe -> ${config.publicUrl}/modifier-mot-de-passe?token=${token}`);
};

/**
 *
 * @param {*} param0
 */
export const generatePasswordUpdateTokenForUserLegacy = async (username) => {
  logger.info(`Génération d'un lien de MAJ de mot de passe pour un ancien user ${username}`);
  const token = await generatePasswordUpdateTokenLegacy(username);

  logger.info(`Token pour ${username} créé avec succès -> ${token}`);
  logger.info(`Lien de changement de mot de passe -> ${config.publicUrl}/modifier-mot-de-passe?token=${token}`);
};
