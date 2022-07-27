const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "cfas";

const createCfasCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);

    await collection.createIndex({ nom: "text", nom_tokenized: "text" }, { default_language: "french" });
    await collection.createIndex({ uai: 1 });
    await collection.createIndex({ sirets: 1 });
  }
};

const dropCfasCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createCfasCollectionIndexes, dropCfasCollectionIndexes };
