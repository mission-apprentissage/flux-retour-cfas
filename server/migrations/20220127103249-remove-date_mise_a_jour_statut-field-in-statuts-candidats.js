module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { date_mise_a_jour_statut: "" } });
  },

  async down() {},
};
