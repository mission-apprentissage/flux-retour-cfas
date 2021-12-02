// statut_mise_a_jour_statut are not useful to us

module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { statut_mise_a_jour_statut: "" } });
  },

  async down() {},
};
