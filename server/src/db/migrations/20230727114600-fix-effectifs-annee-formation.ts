import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const collection = db.collection("effectifs");
  await collection.updateMany({ "formation.annee": "1" }, { $set: { "formation.annee": 1 } });
  await collection.updateMany({ "formation.annee": "2" }, { $set: { "formation.annee": 2 } });
  await collection.updateMany({ "formation.annee": "3" }, { $set: { "formation.annee": 3 } });
};
