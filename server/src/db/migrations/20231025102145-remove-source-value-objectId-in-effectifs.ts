import { Db, ObjectId } from "mongodb";

export const up = async (db: Db) => {
  const collection = db.collection("effectifs");

  const distinctSourceValuesToRemove = (await collection.distinct("source", { source: { $exists: true } })).filter(
    (sourceValue) => ObjectId.isValid(sourceValue)
  );

  await collection.updateMany({ source: { $in: distinctSourceValuesToRemove } }, { $set: { source: "televersement" } });
};
