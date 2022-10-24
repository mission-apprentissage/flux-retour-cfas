const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "partageSimplifieDonneesApprenants";

const createPsDonneesApprenantsIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);
    await collection.createIndex({ user_email: 1 }, { name: "user_email" });
  }
};

const dropPsDonneesApprenantsIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createPsDonneesApprenantsIndex, dropPsDonneesApprenantsIndex };
