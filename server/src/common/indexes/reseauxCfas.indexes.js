const createReseauxCfasCollectionIndexes = async (db) => {
  const collection = db.collection("reseauxCfas");

  await collection.createIndex({ nom_etablissement: "text", nom_tokenized: "text" }, { default_language: "french" });
  await collection.createIndex({ uai: 1 });
  await collection.createIndex({ sirets: 1 });
};

const dropReseauxCfasCollectionIndexes = async (db) => {
  const collection = db.collection("reseauxCfas");

  await collection.dropIndexes();
};

module.exports = { createReseauxCfasCollectionIndexes, dropReseauxCfasCollectionIndexes };
