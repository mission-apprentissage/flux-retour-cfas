import { updatePasswordLegacy } from "../../../common/actions/legacy/users.legacy.actions.js";
import logger from "../../../common/logger.js";

/**
 * Méthode de génération d'un token de MAJ de mot de passe pour un ancien utilisateur (legacy)
 * @param {*}
 */
export const generatePasswordUpdateTokenForUserLegacy = async (username) => {
  logger.info(`Génération du token de MAJ de mot de passe pour un ancien user ${username}`);
  const token = await generatePasswordUpdateTokenForUserLegacy(username);
  logger.info(`Token pour ${username} créé avec succès -> ${token}`);
};

/**
 * Méthode de changement de mot de passe pour un utilisateur legacy
 * @param {*}
 */
export const updatePasswordForUserLegacy = async (token, newPassword) => {
  logger.info(`MAJ de mot de passe pour un ancien user avec token ${token}`);
  await updatePasswordLegacy(token, newPassword);
  logger.info(`Mot de passe MAJ avec succès !`);
};
