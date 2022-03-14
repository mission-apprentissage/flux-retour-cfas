module.exports = {
  async up(db) {
    await db.collection("statutsCandidats").rename("dossiersApprenants");
  },

  async down(db) {
    await db.collection("dossiersApprenants").rename("statutsCandidats");
  },
};
