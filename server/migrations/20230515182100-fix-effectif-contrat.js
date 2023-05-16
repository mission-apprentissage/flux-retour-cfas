export const up = async (db) => {
  const collectionName = "effectifs_old";

  const collectionsInDb = await db.listCollections().toArray();
  const collectionExistsInDb = collectionsInDb.map(({ name }) => name).includes(collectionName);
  if (!collectionExistsInDb) {
    return;
  }
  const cursor = db.collection(collectionName).find({ "apprenant.contrats": { $exists: true } });

  while (await cursor.hasNext()) {
    const effectifOld = await cursor.next();
    console.info(`Migrating ${effectifOld._id}...`);
    await db
      .collection("effectifs")
      .updateOne(
        { _id: effectifOld._id },
        { $set: { contrats: effectifOld.contrats } },
        { bypassDocumentValidation: true }
      );
  }
};
