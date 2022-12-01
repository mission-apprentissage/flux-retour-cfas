import { createUser } from "../../common/actions/users.actions.js";
import { USER_ACCOUNT_STATUS } from "../../common/constants/usersConstants.js";
import logger from "../../common/logger.js";
import { jobEventsDb } from "../../common/model/collections.js";
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

  await jobEventsDb().insertOne({
    jobname: "create-user",
    date: new Date(),
    action: "create-user",
    data: { email },
  });

  logger.info(`User ${email} successfully created`);
};
