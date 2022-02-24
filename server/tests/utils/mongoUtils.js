// eslint-disable-next-line node/no-unpublished-require
const { MongoMemoryServer } = require("mongodb-memory-server");
const { mongooseInstance, closeMongoConnection, connectToMongo } = require("../../src/common/mongodb");

let mongoInMemory;

const startAndConnectMongodb = async () => {
  mongoInMemory = await MongoMemoryServer.create({
    binary: {
      version: "5.0.2",
    },
  });
  const uri = mongoInMemory.getUri();
  const { db } = await connectToMongo(uri);
  return db;
};

const stopMongodb = async () => {
  await closeMongoConnection();
  await mongoInMemory.stop();
};

const clearAllCollections = async () => {
  const collections = mongooseInstance.connection.collections;

  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany({});
    })
  );
};

module.exports = {
  startAndConnectMongodb,
  stopMongodb,
  clearAllCollections,
};
