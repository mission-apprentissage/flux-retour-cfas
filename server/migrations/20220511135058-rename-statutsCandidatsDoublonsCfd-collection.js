module.exports = {
  async up(db) {
    await db.collection("statutsCandidatsDoublonsCfd").rename("dossiersApprenantsDoublonsCfd");
  },

  async down(db) {
    await db.collection("dossiersApprenantsDoublonsCfd").rename("statutsCandidatsDoublonsCfd");
  },
};
