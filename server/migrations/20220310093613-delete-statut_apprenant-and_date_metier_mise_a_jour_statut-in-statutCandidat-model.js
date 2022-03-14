module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany({}, { $unset: { statut_apprenant: "", date_metier_mise_a_jour_statut: "" } });
  },

  async down() {},
};
