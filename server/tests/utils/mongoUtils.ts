import { connectToMongodb, closeMongodbConnection } from "@/common/mongodb";

export const startAndConnectMongodb = async () => {
  await connectToMongodb(globalThis.__MONGO_URI__);
};

export const stopMongodb = async () => {
  await closeMongodbConnection();
};
