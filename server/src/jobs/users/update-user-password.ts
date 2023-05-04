import Logger from "bunyan";

import { updatePasswordLegacy } from "@/common/actions/legacy/users.legacy.actions";

export const updateUserPassword = async (logger: Logger, token, password) => {
  await updatePasswordLegacy(token, password);
  logger.info(`Modification du mot de passe de l'utilisateur effectuée avec succès !`);
};
