/* will add a field `siret` with value empty string to all documents that don't have one */

module.exports = {
  async up() {},

  async down(db) {
    db.collection("statutsCandidats").updateMany({ siret_etablissement: "" }, { $unset: { siret_etablissement: "" } });
  },
};
