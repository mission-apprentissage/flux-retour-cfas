export const up = async (db) => {
  db.collection("users").updateMany({ apiKey: { $exists: true } }, { $unset: { apiKey: "" } });
};

export const down = async () => {};
