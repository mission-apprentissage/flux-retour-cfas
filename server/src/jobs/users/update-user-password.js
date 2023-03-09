import { updatePasswordLegacy } from "../../common/actions/legacy/users.legacy.actions.js";
import logger from "../../common/logger.js";

export const updateUserPassword = async (token, password) => {
  await updatePasswordLegacy(token, password);
  logger.info(`Modification du mot de passe de l'utilisateur effectuée avec succès !`);
};
