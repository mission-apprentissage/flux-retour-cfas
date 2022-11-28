import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import { usersDb } from "../../../../common/model/collections.js";

/**
 * Ce script marque les utilisateurs non ERP comme étant archivés
 */
export const migrateUsersToArchives = async () => {
  logger.info("Migration des users à marquer comme archivés (users non ERP)");

  // Récupération des users n'étant pas fournisseur via API
  const usersNotErp = await usersDb()
    .find({ permissions: { $not: /.*apiStatutsSeeder.*/i } }) // TODO remove hardcoded value ?
    .toArray();

  await asyncForEach(usersNotErp, async (currentUserToArchive) => {
    await usersDb().findOneAndUpdate(
      { _id: currentUserToArchive._id },
      { $set: { archived_at: new Date() } },
      { returnDocument: "after" }
    );
    logger.info(`User ${currentUserToArchive.username} archivé`);
  });

  logger.info("Migration des users done !");
};
