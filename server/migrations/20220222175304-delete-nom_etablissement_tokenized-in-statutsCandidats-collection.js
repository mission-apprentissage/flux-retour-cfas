export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { nom_etablissement_tokenized: "" } });
};

export const down = async () => {};
