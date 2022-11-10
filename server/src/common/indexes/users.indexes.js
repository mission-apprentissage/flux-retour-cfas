const { getDbCollection } = require("../mongodb");
const { doesCollectionExistInDb } = require("../utils/dbUtils");

const collectionName = "users";

const createUsersCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    const collection = getDbCollection(collectionName);

    await collection.createIndex({ username: 1 });
    await collection.createIndex({ email: 1 });
    await collection.createIndex({ organisme: 1 });
  }
};

const dropUsersCollectionIndexes = async () => {
  if (await doesCollectionExistInDb(collectionName)) {
    getDbCollection(collectionName).dropIndexes();
  }
};

module.exports = { createUsersCollectionIndexes, dropUsersCollectionIndexes };
