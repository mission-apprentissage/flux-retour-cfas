export const up = async (db) => {
  const collection = db.collection("cfas");
  await collection.updateMany({}, { $unset: { branchement_tdb: "", source_seed_cfa: "" } });
};

export const down = async () => {};
