import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const collection = db.collection("organismes");
  await collection.updateMany({ siret: { $exists: true } }, { $unset: { sirets: "" } });
};
