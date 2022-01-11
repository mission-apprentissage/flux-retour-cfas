const createFormationsCollectionIndexes = async (db) => {
  const collection = db.collection("formations");

  await collection.createIndex({ libelle: "text", tokenized_libelle: "text" }, { default_language: "french" });
  await collection.createIndex({ cfd: 1 }, { unique: true });
};

const dropFormationsCollectionIndexes = async (db) => {
  const collection = db.collection("formations");

  await collection.dropIndexes();
};

module.exports = { createFormationsCollectionIndexes, dropFormationsCollectionIndexes };
