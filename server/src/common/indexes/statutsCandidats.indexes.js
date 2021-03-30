const createStatutsCandidatsCollectionIndexes = async (db) => {
  const collection = db.collection("statutsCandidats");

  await collection.createIndex({ statut_apprenant: 1 }, { name: "statut_apprenant" });
  await collection.createIndex({ source: 1 }, { name: "source" });
  await collection.createIndex({ source: 1, statut_apprenant: 1 }, { name: "source-statut_apprenant" });
  await collection.createIndex({ ine_apprenant: 1 }, { name: "ine_apprenant" });
  await collection.createIndex({ uai_etablissement: 1 }, { name: "uai_etablissement" });
  await collection.createIndex({ siret_etablissement: 1 }, { name: "siret_etablissement" });
  await collection.createIndex({ siret_etablissement_valid: 1 }, { name: "siret_etablissement_valid" });
  await collection.createIndex({ id_formation: 1 }, { name: "id_formation" });
  await collection.createIndex({ etablissement_num_region: 1 }, { name: "etablissement_num_region" });
  await collection.createIndex({ etablissement_num_departement: 1 }, { name: "etablissement_num_departement" });

  await collection.createIndex(
    { nom_etablissement: "text", tokenized_nom_etablissement: "text" },
    { default_language: "french" }
  );
};

module.exports = { createStatutsCandidatsCollectionIndexes };
