const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "reseauxCfas";

const createReseauxCfasCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);

    await collection.createIndex({ nom_etablissement: "text", nom_tokenized: "text" }, { default_language: "french" });
    await collection.createIndex({ uai: 1 });
    await collection.createIndex({ siret: 1 });
    await collection.createIndex({ nom_reseau: 1 });
  }
};

const dropReseauxCfasCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createReseauxCfasCollectionIndexes, dropReseauxCfasCollectionIndexes };
