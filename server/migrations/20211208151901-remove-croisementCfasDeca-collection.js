// statut_mise_a_jour_statut are not useful to us

module.exports = {
  async up(db) {
    db.collection("croisementCfasDeca").drop();
  },

  async down() {},
};
