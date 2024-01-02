import { generatePasswordUpdateTokenLegacy } from "@/common/actions/legacy/users.legacy.actions";
import { generatePasswordUpdateToken } from "@/common/actions/users.actions";
import logger from "@/common/logger";
import config from "@/config";

export const generatePasswordUpdateTokenForUser = async (email: string) => {
  logger.info(`Génération d'un lien de MAJ de mot de passe pour ${email}`);
  const token = await generatePasswordUpdateToken(email);

  logger.info(`Token pour ${email} créé avec succès -> ${token}`);
  // TODO Update when parcours UI finished & good route
  logger.info(`Lien de changement de mot de passe -> ${config.publicUrl}/modifier-mot-de-passe?token=${token}`);
};

export const generatePasswordUpdateTokenForUserLegacy = async (username: string) => {
  logger.info(`Génération d'un lien de MAJ de mot de passe pour un ancien user ${username}`);
  const token = await generatePasswordUpdateTokenLegacy(username);
  logger.info(`Token pour ${username} créé avec succès -> ${token}`);
};
