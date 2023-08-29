export const up = async (db) => {
  const collectionName = "effectifs_old";

  const collectionsInDb = await db.listCollections().toArray();
  const collectionExistsInDb = collectionsInDb.map(({ name }) => name).includes(collectionName);
  if (!collectionExistsInDb) {
    return;
  }
  const effectifsWithContrat = (
    await db
      .collection(collectionName)
      .find({ "apprenant.contrats": { $exists: true } })
      .toArray()
  ).map((item) => item._id);

  for (const effectif of effectifsWithContrat) {
    await db.collection("effectifs").updateOne({ _id: effectif._id }, { $set: { contrats: effectif.contrats } });
  }
};
