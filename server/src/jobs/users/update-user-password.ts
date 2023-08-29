import { updatePasswordLegacy } from "@/common/actions/legacy/users.legacy.actions";
import logger from "@/common/logger";

export const updateUserPassword = async ({ token, password }) => {
  await updatePasswordLegacy(token, password);
  logger.info(`Modification du mot de passe de l'utilisateur effectuée avec succès !`);
};
