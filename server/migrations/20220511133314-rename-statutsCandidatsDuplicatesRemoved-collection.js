module.exports = {
  async up(db) {
    await db.collection("statutsCandidatsDuplicatesRemoved").rename("dossiersApprenantsDuplicatesRemoved");
  },

  async down(db) {
    await db.collection("dossiersApprenantsDuplicatesRemoved").rename("statutsCandidatsDuplicatesRemoved");
  },
};
