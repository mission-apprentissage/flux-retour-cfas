module.exports = {
  async up(db) {
    db.collection("statutsCandidats").updateMany({ erps: null }, { $set: { erps: [] } });
    db.collection("statutsCandidats").updateMany(
      { etablissement_reseaux: null },
      { $set: { etablissement_reseaux: [] } }
    );
  },

  async down(db) {
    db.collection("statutsCandidats").updateMany({ erps: [] }, { $set: { erps: null } });
    db.collection("statutsCandidats").updateMany(
      { etablissement_reseaux: [] },
      { $set: { etablissement_reseaux: null } }
    );
  },
};
