import { Db, ObjectId } from "mongodb";

export const up = async (db: Db) => {
  const collection = db.collection("organismes");

  const distinctErpsValuesToRemove = (await collection.distinct("erps", { erps: { $exists: true, $ne: [] } })).filter(
    (erpValue) => ObjectId.isValid(erpValue)
  );

  await Promise.all(
    distinctErpsValuesToRemove.map(async (erpValueToRemove) => {
      await collection.updateMany({ erps: erpValueToRemove }, { $pull: { erps: erpValueToRemove } });
    })
  );
};
