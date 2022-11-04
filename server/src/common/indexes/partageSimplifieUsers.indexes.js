const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "partageSimplifieUsers";

const createPsUsersIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);
    await collection.createIndex({ email: 1 }, { name: "email", unique: true });

    // Ajout d'un index unique sur le couple UAI-SIRET uniques lorsque l'uai et le siret sont non nulls (ie => string)
    // cf. https://stackoverflow.com/questions/64066830/creating-a-partial-index-when-field-is-not-null
    await collection.createIndex(
      { uai: 1, siret: 1 },
      {
        name: "uai_siret_uniques",
        unique: true,
        partialFilterExpression: { uai: { $type: "string" }, siret: { $type: "string" } },
      }
    );
  }
};

const dropPsUsersIndex = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createPsUsersIndex, dropPsUsersIndex };
