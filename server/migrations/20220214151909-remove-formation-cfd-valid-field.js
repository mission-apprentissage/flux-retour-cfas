export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { formation_cfd_valid: "" } });
};

export const down = async () => {};
