import { connectToMongodb, closeMongodbConnection } from "@/common/mongodb";
import config from "@/config";

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.JEST_WORKER_ID}`;
  await connectToMongodb(config.mongodb.uri.replace("{{JEST_WORKER_ID}}", workerId));
};

export const stopMongodb = async () => {
  await closeMongodbConnection();
};
