import dotenv from "dotenv";
import { MongoClient } from "mongodb";

export default async () => {
  dotenv.config({ path: "./server/.env.test" });

  const mongoUri = `${process.env.MNA_TDB_MONGODB_URI}${process.env.MNA_TDB_MONGODB_DB_NAME}?${process.env.MNA_TDB_MONGODB_OPTIONS}`;
  const workerId = `${process.env.JEST_WORKER_ID ?? ""}`;
  const client = new MongoClient(mongoUri.replace("{{JEST_WORKER_ID}}", workerId) ?? "");
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
