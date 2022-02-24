module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { formation_cfd_valid: "" } });
  },

  async down() {},
};
