export const up = async (/** @type {import('mongodb').Db} */ db) => {
  // backup des usersMigration
  const users = await db.collection("usersMigration").find().toArray();
  if (users.length > 0) {
    await db.collection("usersMigration_old").insertMany(users);
  }
};
