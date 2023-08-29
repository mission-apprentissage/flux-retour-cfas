export const up = async (db) => {
  const collection = db.collection("fiabilisationUaiSiret");
  await collection.updateMany(
    { siret: { $exists: true }, type: { $exists: false } },
    { $set: { type: "A_FIABILISER" } }
  );
};
