module.exports = {
  async up(db) {
    if (db.collections.statutsCandidatsDoublonsCfd) {
      await db.collection("statutsCandidatsDoublonsCfd").rename("dossiersApprenantsDoublonsCfd");
    }
  },

  async down(db) {
    if (db.collections.dossiersApprenantsDoublonsCfd) {
      await db.collection("dossiersApprenantsDoublonsCfd").rename("statutsCandidatsDoublonsCfd");
    }
  },
};
