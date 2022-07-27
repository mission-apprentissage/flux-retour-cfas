const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "userEvents";

const createUserEventsCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    const collection = db.collection(collectionName);

    await collection.createIndex({ username: 1 }, { name: "username" });
    await collection.createIndex({ action: 1 }, { name: "action" });
  }
};

const dropUserEventsCollectionIndexes = async (db) => {
  if (await doesCollectionExistInDb(db, collectionName)) {
    db.collection(collectionName).dropIndexes();
  }
};

module.exports = { createUserEventsCollectionIndexes, dropUserEventsCollectionIndexes };
