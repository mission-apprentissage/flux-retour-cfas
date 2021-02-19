const createUserEventsCollectionIndexes = async (db) => {
  const collection = db.collection("userEvents");

  await collection.createIndex({ username: 1 }, { name: "username" });
};

module.exports = { createUserEventsCollectionIndexes };
