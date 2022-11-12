export const up = async (db) => {
  db.collection("stats").drop();
};

export const down = async () => {};
