const { getDbCollection } = require("../mongodb");
const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "userEvents";

const createUserEventsCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    const collection = getDbCollection(collectionName);

    await collection.createIndex({ username: 1 }, { name: "username" });
    await collection.createIndex({ action: 1 }, { name: "action" });
  }
};

const dropUserEventsCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    getDbCollection(collectionName).dropIndexes();
  }
};

module.exports = { createUserEventsCollectionIndexes, dropUserEventsCollectionIndexes };
