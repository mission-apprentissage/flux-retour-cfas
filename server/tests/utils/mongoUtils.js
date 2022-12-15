// eslint-disable-next-line node/no-unpublished-require
import { MongoMemoryServer } from "mongodb-memory-server";

import { connectToMongodb, closeMongodbConnection } from "../../src/common/mongodb.js";

let mongoInMemory;

export const startAndConnectMongodb = async () => {
  mongoInMemory = await MongoMemoryServer.create({
    binary: {
      version: "6.0.2",
    },
  });
  const uri = mongoInMemory.getUri();
  await connectToMongodb(uri);
};

export const stopMongodb = async () => {
  await closeMongodbConnection();
  await mongoInMemory.stop();
};
