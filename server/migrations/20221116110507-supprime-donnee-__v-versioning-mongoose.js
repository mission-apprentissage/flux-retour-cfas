export const up = async (db) => {
  const collectionsInDb = await db.listCollections().toArray();

  for (let i = 0; i < collectionsInDb.length; i++) {
    await db.collection(collectionsInDb[i].name).updateMany({}, { $unset: { __v: "" } });
  }
};
