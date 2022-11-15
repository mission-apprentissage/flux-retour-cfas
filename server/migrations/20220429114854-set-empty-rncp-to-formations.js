export const up = async (db) => {
  db.collection("formations").updateMany({ rncp: { $exists: false } }, { $set: { rncp: "" } });
};

export const down = async () => {};
