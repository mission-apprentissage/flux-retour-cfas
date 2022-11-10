const { getDbCollection } = require("../mongodb");
const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "reseauxCfas";

const createReseauxCfasCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    const collection = getDbCollection(collectionName);

    await collection.createIndex({ nom_etablissement: "text", nom_tokenized: "text" }, { default_language: "french" });
    await collection.createIndex({ uai: 1 });
    await collection.createIndex({ siret: 1 });
    await collection.createIndex({ nom_reseau: 1 });
  }
};

const dropReseauxCfasCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    getDbCollection(collectionName).dropIndexes();
  }
};

module.exports = { createReseauxCfasCollectionIndexes, dropReseauxCfasCollectionIndexes };
