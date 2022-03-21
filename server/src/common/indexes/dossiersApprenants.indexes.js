const createDossiersApprenantsCollectionIndexes = async (db) => {
  const collection = db.collection("dossiersApprenants");

  await collection.createIndex({ uai_etablissement: 1 }, { name: "uai_etablissement" });
  await collection.createIndex({ siret_etablissement: 1 }, { name: "siret_etablissement" });
  await collection.createIndex({ siret_etablissement_valid: 1 }, { name: "siret_etablissement_valid" });
  await collection.createIndex({ formation_cfd: 1 }, { name: "formation_cfd" });
  await collection.createIndex({ etablissement_num_region: 1 }, { name: "etablissement_num_region" });
  await collection.createIndex({ etablissement_num_departement: 1 }, { name: "etablissement_num_departement" });
  await collection.createIndex({ annee_scolaire: 1 }, { name: "annee_scolaire" });
  await collection.createIndex({ etablissement_reseaux: 1 }, { name: "etablissement_reseaux" });
};

const dropDossiersApprenantsCollectionIndexes = async (db) => {
  const collection = db.collection("dossiersApprenants");

  await collection.dropIndexes();
};

module.exports = { createDossiersApprenantsCollectionIndexes, dropDossiersApprenantsCollectionIndexes };
