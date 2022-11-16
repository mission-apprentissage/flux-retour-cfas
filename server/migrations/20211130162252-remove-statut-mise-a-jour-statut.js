// statut_mise_a_jour_statut are not useful to us

export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { statut_mise_a_jour_statut: "" } });
};

export const down = async () => {};
