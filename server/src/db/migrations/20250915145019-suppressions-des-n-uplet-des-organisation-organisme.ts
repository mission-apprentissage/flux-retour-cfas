import logger from "@/common/logger";
import { organisationsDb, usersMigrationDb } from "@/common/model/collections";

// Suppression des organisations de type ORGANISME_FORMATION n'ayant aucun utilisateur rattaché
export const up = async () => {
  let deletionCount = 0;
  const data = await organisationsDb()
    .find({ type: "ORGANISME_FORMATION", ml_beta_activated_at: { $exists: false } })
    .toArray();

  for (const orga of data) {
    const users = await usersMigrationDb().find({ organisation_id: orga._id }).toArray();
    if (users.length === 0) {
      deletionCount++;
      logger.info(`Suppression de l'organisme ${orga._id} car aucun utilisateur n'y est rattaché`);
      await organisationsDb().deleteOne({ _id: orga._id });
    }
  }
  logger.info(`Nombre d'organisations supprimés : ${deletionCount}`);
};
