export const up = async (db) => {
  await db.collection("cfaDataFeedback").updateMany({}, { $unset: { donnee_est_valide: "" } });
  await db.collection("cfas").updateMany({}, { $unset: { feedback_donnee_valide: "" } });
};

export const down = async () => {};
