const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "partageSimplifieSignalementAnomalie";

const createPsSignalementAnomalieIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);
    await collection.createIndex({ email: 1 }, { name: "email" });
  }
};

const dropPsSignalementAnomalieIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createPsSignalementAnomalieIndex, dropPsSignalementAnomalieIndex };
