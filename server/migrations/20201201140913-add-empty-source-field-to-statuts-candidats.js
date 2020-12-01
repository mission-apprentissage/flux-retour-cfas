/* will add a field `source` with value empty string to all documents that don't have one */

module.exports = {
  async up(db) {
    db.collection("statutsCandidats").updateMany({ source: { $exists: false } }, { $set: { source: "" } });
  },

  async down(db) {
    db.collection("statutsCandidats").updateMany({ source: "" }, { $unset: { source: "" } });
  },
};
