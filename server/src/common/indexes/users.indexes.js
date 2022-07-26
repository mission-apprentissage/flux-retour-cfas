const createUsersCollectionIndexes = async (db) => {
  const collection = db.collection("users");

  await collection.createIndex({ username: 1 });
  await collection.createIndex({ email: 1 });
  await collection.createIndex({ organisme: 1 });
};

const dropUsersCollectionIndexes = async (db) => {
  const collection = db.collection("users");

  await collection.dropIndexes();
};

module.exports = { createUsersCollectionIndexes, dropUsersCollectionIndexes };
