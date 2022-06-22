module.exports = {
  async up(db) {
    db.collection("cfasAnnuaire").drop();
    db.collection("croisementCfaAnnuaireassociés").drop();
    db.collection("croisementVoeuxAffelnet").drop();
  },
  async down() {},
};
