module.exports = {
  async up(db) {
    if (db.collections.statutsCandidatsDoublonsUais) {
      await db.collection("statutsCandidatsDoublonsUais").rename("dossiersApprenantsDoublonsUais");
    }
  },

  async down(db) {
    if (db.collections.dossiersApprenantsDoublonsUais) {
      await db.collection("dossiersApprenantsDoublonsUais").rename("statutsCandidatsDoublonsUais");
    }
  },
};
