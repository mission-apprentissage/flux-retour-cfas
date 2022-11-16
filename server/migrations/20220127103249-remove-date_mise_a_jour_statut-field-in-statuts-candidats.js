export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { date_mise_a_jour_statut: "" } });
};

export const down = async () => {};
