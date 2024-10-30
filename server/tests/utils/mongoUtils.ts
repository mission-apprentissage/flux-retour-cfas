import { connectToMongodb, closeMongodbConnection, getMongodbUri } from "@/common/mongodb";

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.VITEST_WORKER_ID}`;
  await connectToMongodb(getMongodbUri().replace("{{VITEST_WORKER_ID}}", workerId));
};

export const stopMongodb = async () => {
  await closeMongodbConnection();
};
