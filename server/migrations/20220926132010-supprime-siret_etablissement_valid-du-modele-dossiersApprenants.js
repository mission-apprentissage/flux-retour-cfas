export const up = async (db) => {
  const collection = db.collection("dossiersApprenants");
  await collection.updateMany({}, { $unset: { siret_etablissement_valid: "" } });
};

export const down = async () => {};
