export const up = async (db) => {
  const collection = db.collection("effectifs");
  await collection.updateMany({ contrats: null }, { $set: { contrats: [] } }, { bypassDocumentValidation: true });
};
