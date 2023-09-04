import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const collection = db.collection("fiabilisationUaiSiret");
  await collection.updateMany(
    { siret: { $exists: true }, type: { $exists: false } },
    { $set: { type: "A_FIABILISER" } }
  );
};
