import { Db, type ObjectId } from "mongodb";

import { organismesDb, usersMigrationDb } from "@/common/model/collections";

const countOrganismeUsers = async (organismeId: ObjectId) => {
  return await usersMigrationDb().countDocuments({ organismes: organismeId });
};

export const up = async (db: Db) => {
  const organismes = organismesDb().find({ effectifs_count: 0 });
  for await (const organisme of organismes) {
    const usersCount = await countOrganismeUsers(organisme._id);
    if (usersCount === 0) {
      await db.collection("migration-20241025115945-clean-organismes").insertOne({
        op: "delete-organisme",
        organisme,
      });
      await organismesDb().deleteOne({ _id: organisme._id });
    }
  }
};
