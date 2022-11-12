// eslint-disable-next-line node/no-unpublished-require
import { MongoMemoryServer } from "mongodb-memory-server";

import { connectToMongodb, closeMongodbConnection, getDatabase, getDbCollection } from "../../src/common/mongodb.js";
import { asyncForEach } from "../../src/common/utils/asyncUtils.js";

let mongoInMemory;

export const startAndConnectMongodb = async () => {
  mongoInMemory = await MongoMemoryServer.create({
    binary: {
      version: "5.0.2",
    },
  });
  const uri = mongoInMemory.getUri();
  await connectToMongodb(uri);
};

export const stopMongodb = async () => {
  await closeMongodbConnection();
  await mongoInMemory.stop();
};

export const clearAllCollections = async () => {
  const collections = await getDatabase().listCollections({}, { nameOnly: true }).toArray();

  await asyncForEach(collections, async (collection) => {
    await getDbCollection(collection.name).deleteMany({});
  });
};
