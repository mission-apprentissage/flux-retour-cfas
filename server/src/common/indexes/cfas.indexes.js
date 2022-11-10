const { getDbCollection } = require("../mongodb");
const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "cfas";

const createCfasCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    const collection = getDbCollection(collectionName);

    await collection.createIndex({ nom: "text", nom_tokenized: "text" }, { default_language: "french" });
    await collection.createIndex({ uai: 1 });
    await collection.createIndex({ sirets: 1 });
  }
};

const dropCfasCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    getDbCollection(collectionName).dropIndexes();
  }
};

module.exports = { createCfasCollectionIndexes, dropCfasCollectionIndexes };
