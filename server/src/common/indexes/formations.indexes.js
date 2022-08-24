const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "formations";

const createFormationsCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);

    await collection.createIndex({ libelle: "text", tokenized_libelle: "text" }, { default_language: "french" });
    await collection.createIndex({ cfd: 1 }, { unique: true });
    await collection.createIndex({ rncps: 1 });
  }
};

const dropFormationsCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createFormationsCollectionIndexes, dropFormationsCollectionIndexes };
