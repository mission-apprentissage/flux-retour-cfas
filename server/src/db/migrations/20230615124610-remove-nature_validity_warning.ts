import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const collection = db.collection("organismes");
  await collection.updateMany({}, { $unset: { nature_validity_warning: "" } });
};
