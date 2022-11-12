export const up = async (db) => {
  const collection = db.collection("formations");
  await collection.updateMany({}, { $unset: { rncp: "" } });
};

export const down = async () => {};
