import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import { usersDb } from "../../../../common/model/collections.js";

/**
 * Ce script nettoie les utilisateurs afin de passer la validation
 * Ajoute une created_at date car pas toujours présente en db mais requise dans le nouveau modèle
 */
export const cleanUserValidation = async () => {
  logger.info("Nettoyage des created_at date des users");

  const allUsers = await usersDb().find().toArray();

  await asyncForEach(allUsers, async (currentUserToClean) => {
    await usersDb().findOneAndUpdate(
      { _id: currentUserToClean._id },
      {
        $set: {
          created_at: currentUserToClean.created_at || new Date(), // if no createdAt already existant set as now ())
        },
      }
    );
    logger.info(`User ${currentUserToClean.username} nettoyé`);
  });

  logger.info("Nettoyage des created_at des users done !");
};
