import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  // backup des usersMigration
  const users = await db.collection("usersMigration").find().toArray();
  if (users.length > 0) {
    await db.collection("usersMigration_old").insertMany(users);
  }
};
