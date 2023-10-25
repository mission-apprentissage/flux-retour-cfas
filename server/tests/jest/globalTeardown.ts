import dotenv from "dotenv";
import { MongoClient } from "mongodb";

export default async () => {
  dotenv.config({ path: "./server/.env.test" });

  const workerId = `${process.env.JEST_WORKER_ID}`;

  const client = new MongoClient(process.env.MNA_TDB_MONGODB_URI?.replace("{{JEST_WORKER_ID}}", workerId) ?? "");
  try {
    await client.connect();
    await client.db().dropDatabase();
  } finally {
    await client.close();
  }
};
