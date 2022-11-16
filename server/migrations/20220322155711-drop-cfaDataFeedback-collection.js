export const up = async (db) => {
  db.collection("cfaDataFeedback").drop();
};

export const down = async () => {};
