module.exports = {
  async up(db) {
    const dossierApprenantsCollection = db.collection("dossiersApprenants");
    await dossierApprenantsCollection.updateMany({}, { $unset: { etablissement_code_postal: "" } });

    const effectifsApprenantsCollection = db.collection("effectifsApprenants");
    await effectifsApprenantsCollection.updateMany({}, { $unset: { etablissement_code_postal: "" } });
  },

  async down() {},
};
