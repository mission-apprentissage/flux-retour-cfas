// nom_representant_legal, tel_representant_legal and tel2_representant_legal are not useful to us

module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");
    await collection.updateMany(
      {},
      { $unset: { nom_representant_legal: "", tel_representant_legal: "", tel2_representant_legal: "" } }
    );
  },

  async down() {},
};
