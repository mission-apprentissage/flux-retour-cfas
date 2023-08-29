export const up = async (db) => {
  const collection = db.collection("organismes");
  await collection.updateMany({}, { $unset: { nature_validity_warning: "" } });
};
