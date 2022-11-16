export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { ne_pas_solliciter: "" } });
};

export const down = async () => {};
