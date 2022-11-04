const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "partageSimplifieDemandeActivationCompte";

const createPsDemandeActivationCompteIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);
    await collection.createIndex({ email: 1 }, { name: "email" });
  }
};

const dropPsDemandeActivationCompteIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createPsDemandeActivationCompteIndex, dropPsDemandeActivationCompteIndex };
