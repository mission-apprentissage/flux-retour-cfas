module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { uai_etablissement_valid: "" } });
  },

  async down() {},
};
