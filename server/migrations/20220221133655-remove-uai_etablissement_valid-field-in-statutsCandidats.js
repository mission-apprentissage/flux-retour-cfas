export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { uai_etablissement_valid: "" } });
};

export const down = async () => {};
