const { getDbCollection } = require("../mongodb");
const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "formations";

const createFormationsCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    const collection = getDbCollection(collectionName);

    await collection.createIndex({ libelle: "text", tokenized_libelle: "text" }, { default_language: "french" });
    await collection.createIndex({ cfd: 1 }, { unique: true });
    await collection.createIndex({ rncps: 1 });
  }
};

const dropFormationsCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    getDbCollection(collectionName).dropIndexes();
  }
};

module.exports = { createFormationsCollectionIndexes, dropFormationsCollectionIndexes };
