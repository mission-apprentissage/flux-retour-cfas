import { Db } from "mongodb";

export const up = async (db: Db) => {
  // cette migration MAJ les champs qualiopi et prepa_apprentissage vides à false
  await db.collection("organismes").updateMany({ qualiopi: { $exists: false } }, { $set: { qualiopi: false } });
  await db
    .collection("organismes")
    .updateMany({ prepa_apprentissage: { $exists: false } }, { $set: { prepa_apprentissage: false } });
};
