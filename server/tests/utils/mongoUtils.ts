import { connectToMongodb, closeMongodbConnection, getMongodbUri } from "@/common/mongodb";

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.JEST_WORKER_ID}`;
  await connectToMongodb(getMongodbUri().replace("{{JEST_WORKER_ID}}", workerId));
};

export const stopMongodb = async () => {
  await closeMongodbConnection();
};
