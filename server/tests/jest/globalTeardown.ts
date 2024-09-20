import dotenv from "dotenv";
import { MongoClient } from "mongodb";

import { getMongodbUri } from "@/common/mongodb";

export default async () => {
  dotenv.config({ path: "./server/.env.test" });

  const workerId = `${process.env.JEST_WORKER_ID ?? ""}`;
  const client = new MongoClient(getMongodbUri()?.replace("{{JEST_WORKER_ID}}", workerId) ?? "");
  try {
    if (process.env.CI) {
      return;
    }
    await client.connect();
    const dbs = await client.db().admin().listDatabases();
    await Promise.all(
      dbs.databases.map((db) => {
        if (db.name.startsWith(`TDB-test-${workerId}`)) {
          return client.db(db.name).dropDatabase();
        }

        return;
      })
    );
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};
