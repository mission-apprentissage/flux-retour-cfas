/* will add a field `source` with value empty string to all documents that don't have one */

export const up = async (db) => {
  db.collection("statutsCandidats").updateMany({ source: { $exists: false } }, { $set: { source: "" } });
};

export const down = async (db) => {
  db.collection("statutsCandidats").updateMany({ source: "" }, { $unset: { source: "" } });
};
