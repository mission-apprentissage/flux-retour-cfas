import { Db, MongoClient } from "mongodb";

export const up = async (_db: Db, _client: MongoClient) => {
  // cette migration MAJ les champs qualiopi et prepa_apprentissage vides à false
  await _db.collection("organismes").updateMany({ qualiopi: { $exists: false } }, { $set: { qualiopi: false } });
  await _db
    .collection("organismes")
    .updateMany({ prepa_apprentissage: { $exists: false } }, { $set: { prepa_apprentissage: false } });
};
