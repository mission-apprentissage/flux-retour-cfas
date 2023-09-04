import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  const collection = db.collection("organismes");
  // @ts-ignore
  await collection.updateMany({ reseaux: "CCI" }, { $pull: { reseaux: "CCI" } });
};
