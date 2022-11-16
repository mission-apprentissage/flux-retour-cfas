export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { statut_apprenant: "", date_metier_mise_a_jour_statut: "" } });
};

export const down = async () => {};
