module.exports = {
  async up(db) {
    if (db.collections.statutsCandidatsDuplicatesRemoved) {
      await db.collection("statutsCandidatsDuplicatesRemoved").rename("dossiersApprenantsDuplicatesRemoved");
    }
  },

  async down(db) {
    if (db.collections.dossiersApprenantsDuplicatesRemoved) {
      await db.collection("dossiersApprenantsDuplicatesRemoved").rename("statutsCandidatsDuplicatesRemoved");
    }
  },
};
