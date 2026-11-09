import { randomBytes } from "node:crypto";

import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    mongoRunId: string;
  }
}

export default async (project: TestProject) => {
  const runId = randomBytes(3).toString("hex");
  project.provide("mongoRunId", runId);

  return async () => {
    dotenv.config({ path: "./server/.env.test" });

    const runDbPrefix = `${process.env.MNA_TDB_MONGODB_DB_NAME}`.replace("{{VITEST_WORKER_ID}}", `${runId}-`);
    const mongoUri = `${process.env.MNA_TDB_MONGODB_URI}${runDbPrefix}?${process.env.MNA_TDB_MONGODB_OPTIONS}`;
    const client = new MongoClient(mongoUri);
    try {
      if (process.env.CI) {
        return;
      }
      await client.connect();
      const dbs = await client.db().admin().listDatabases();
      await Promise.all(
        dbs.databases.map((db) => {
          if (db.name.startsWith(runDbPrefix)) {
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
};
