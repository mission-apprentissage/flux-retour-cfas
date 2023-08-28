import { Db, MongoClient } from "mongodb";

export const up = async (db: Db, _client: MongoClient) => {
  await db
    .collection("organismes")
    .updateMany({ fiabilisation_statut: "FIABILISE" }, { $set: { fiabilisation_statut: "FIABLE" } });
};

export const down = async () => {};
