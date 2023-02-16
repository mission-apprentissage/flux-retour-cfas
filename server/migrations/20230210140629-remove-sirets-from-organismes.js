export const up = async (db) => {
  const collection = db.collection("organismes");
  await collection.updateMany({ siret: { $exists: true } }, { $unset: { sirets: "" } });
};
