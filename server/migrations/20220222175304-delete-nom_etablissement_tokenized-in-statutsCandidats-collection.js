module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { nom_etablissement_tokenized: "" } });
  },

  async down() {},
};
