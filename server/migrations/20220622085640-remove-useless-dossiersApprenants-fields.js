module.exports = {
  async up(db) {
    const collection = db.collection("dossiersApprenants");
    await collection.updateMany(
      {},
      {
        $unset: {
          etablissement_formateur_code_commune_insee: "",
          etablissement_formateur_geo_coordonnees: "",
          date_entree_formation: "",
          libelle_court_formation: "",
        },
      }
    );
  },

  async down() {},
};
