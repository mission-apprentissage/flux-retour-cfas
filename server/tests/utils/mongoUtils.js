// eslint-disable-next-line node/no-unpublished-require
const { MongoMemoryServer } = require("mongodb-memory-server");
const { connectToMongodb, closeMongodbConnection, getDatabase, getDbCollection } = require("../../src/common/mongodb");
const { asyncForEach } = require("../../src/common/utils/asyncUtils");

let mongoInMemory;

const startAndConnectMongodb = async () => {
  mongoInMemory = await MongoMemoryServer.create({
    binary: {
      version: "5.0.2",
    },
  });
  const uri = mongoInMemory.getUri();
  await connectToMongodb(uri);
};

const stopMongodb = async () => {
  await closeMongodbConnection();
  await mongoInMemory.stop();
};

const clearAllCollections = async () => {
  const collections = await getDatabase().listCollections({}, { nameOnly: true }).toArray();

  await asyncForEach(collections, async (collection) => {
    await getDbCollection(collection.name).deleteMany({});
  });
};

module.exports = {
  startAndConnectMongodb,
  stopMongodb,
  clearAllCollections,
};
