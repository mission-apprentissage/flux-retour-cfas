export const up = async (db) => {
  const collection = db.collection("statutsCandidats");
  await collection.updateMany({}, { $unset: { history_antidated: "", history_with_bad_date: "" } });
};

export const down = async () => {};
