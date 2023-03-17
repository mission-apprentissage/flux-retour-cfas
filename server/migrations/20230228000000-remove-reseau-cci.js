export const up = async (db) => {
  const collection = db.collection("organismes");
  await collection.updateMany({ reseaux: "CCI" }, { $pull: { reseaux: "CCI" } });
};
