module.exports = {
  async up(db) {
    await db.collection("statutsCandidatsDoublonsUais").rename("dossiersApprenantsDoublonsUais");
  },

  async down(db) {
    await db.collection("dossiersApprenantsDoublonsUais").rename("statutsCandidatsDoublonsUais");
  },
};
