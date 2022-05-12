const createFormationsCollectionIndexes = async (db) => {
  const collection = db.collection("formations");

  await collection.createIndex({ libelle: "text", tokenized_libelle: "text" }, { default_language: "french" });
  await collection.createIndex({ cfd: 1 }, { unique: true });
  await collection.createIndex({ rncp: 1 });
};

const dropFormationsCollectionIndexes = async (db) => {
  const collection = db.collection("formations");

  await collection.dropIndexes();
};

module.exports = { createFormationsCollectionIndexes, dropFormationsCollectionIndexes };
