export const up = async (db) => {
  db.collection("rcoStatutsCandidats").drop();
};

export const down = async () => {};
