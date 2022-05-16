const createCfasCollectionIndexes = async (db) => {
  const collection = db.collection("cfas");

  await collection.createIndex({ nom: "text", nom_tokenized: "text" }, { default_language: "french" });
  await collection.createIndex({ uai: 1 });
  await collection.createIndex({ sirets: 1 });
};

const dropCfasCollectionIndexes = async (db) => {
  const collection = db.collection("cfas");

  await collection.dropIndexes();
};

module.exports = { createCfasCollectionIndexes, dropCfasCollectionIndexes };
