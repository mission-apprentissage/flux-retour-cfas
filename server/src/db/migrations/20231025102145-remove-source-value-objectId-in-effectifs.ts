import { Db, ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";

export const up = async (db: Db) => {
  const collection = db.collection("effectifs");

  const distinctSourceValuesToRemove = (await collection.distinct("source", { source: { $exists: true } })).filter(
    (sourceValue) => ObjectId.isValid(sourceValue)
  );

  await Promise.all(
    distinctSourceValuesToRemove.map(async (sourceToRemove) => {
      await collection.updateMany(
        { source: sourceToRemove },
        { $set: { source: SOURCE_APPRENANT.FICHIER, source_organisme_id: sourceToRemove } }
      );
    })
  );
};
