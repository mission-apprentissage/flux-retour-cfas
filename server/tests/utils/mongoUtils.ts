import { MongoMemoryServer } from "mongodb-memory-server";

import { connectToMongodb, closeMongodbConnection } from "@/common/mongodb";

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
