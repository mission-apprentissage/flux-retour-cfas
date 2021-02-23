const createFormationsCollectionIndexes = async (db) => {
  const collection = db.collection("formations");

  await collection.createIndex({ libelle: "text", tokenized_libelle: "text" }, { default_language: "french" });
  await collection.createIndex({ cfd: 1 }, { unique: true });
};

module.exports = { createFormationsCollectionIndexes };
