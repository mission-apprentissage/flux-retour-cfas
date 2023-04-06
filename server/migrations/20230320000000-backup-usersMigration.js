export const up = async (/** @type {import('mongodb').Db} */ db) => {
  // backup des usersMigration
  await db.collection("usersMigration_old").insertMany(await db.collection("usersMigration").find().toArray());
};
