module.exports = {
  async up(db) {
    const collection = db.collection("cfas");
    await collection.updateMany({}, { $unset: { branchement_tdb: "", source_seed_cfa: "" } });
  },

  async down() {},
};
