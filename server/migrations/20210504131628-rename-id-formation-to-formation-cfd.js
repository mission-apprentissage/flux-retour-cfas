module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");

    await collection.updateMany(
      {},
      { $rename: { id_formation: "formation_cfd", id_formation_valid: "formation_cfd_valid" } }
    );
  },

  async down(db) {
    const collection = db.collection("statutsCandidats");

    await collection.updateMany(
      {},
      { $rename: { formation_cfd: "id_formation", formation_cfd_valid: "id_formation_valid" } }
    );
  },
};
