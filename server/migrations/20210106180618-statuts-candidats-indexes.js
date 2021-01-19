module.exports = {
  async up(db) {
    const collection = db.collection("statutsCandidats");

    await collection.createIndex({ statut_apprenant: 1 }, { name: "statut_apprenant" });
    await collection.createIndex({ source: 1 }, { name: "source" });
    await collection.createIndex({ source: 1, statut_apprenant: 1 }, { name: "source-statut_apprenant" });
    await collection.createIndex({ ine_apprenant: 1 }, { name: "ine_apprenant" });
    await collection.createIndex({ uai_etablissement: 1 }, { name: "uai_etablissement" });
  },

  async down(db) {
    const collection = db.collection("statutsCandidats");

    await collection.dropIndex({ name: "statut_apprenant" });
    await collection.dropIndex({ name: "source" });
    await collection.dropIndex({ name: "source-statut_apprenant" });
    await collection.dropIndex({ name: "ine_apprenant" });
    await collection.dropIndex({ name: "uai_etablissement" });
  },
};
