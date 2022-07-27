const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "users";

const createUsersCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);

    await collection.createIndex({ username: 1 });
    await collection.createIndex({ email: 1 });
    await collection.createIndex({ organisme: 1 });
  }
};

const dropUsersCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createUsersCollectionIndexes, dropUsersCollectionIndexes };
