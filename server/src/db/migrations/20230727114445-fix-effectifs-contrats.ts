import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const collection = db.collection("effectifs");
  await collection.updateMany({ contrats: null }, { $set: { contrats: [] } }, { bypassDocumentValidation: true });
};
