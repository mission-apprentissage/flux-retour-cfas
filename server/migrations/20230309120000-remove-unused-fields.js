export const up = async (db) => {
  await db.collection("users").updateMany({}, { $unset: { orign_register: "" } });

  await db
    .collection("usersMigration")
    .updateMany({}, { $unset: { orign_register: "", description: "", custom_acl: "", tour_guide: "" } });

  await db.collection("permissions").updateMany({}, { $unset: { custom_acl: "" } });
};
