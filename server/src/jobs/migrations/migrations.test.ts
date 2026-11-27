import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

import { assertNoMigrationLock } from "./migrations";

describe("assertNoMigrationLock", () => {
  useMongo();

  it("passe quand aucun verrou n'existe", async () => {
    await expect(assertNoMigrationLock()).resolves.toBeUndefined();
  });

  it("lève quand un verrou est en place", async () => {
    await getDatabase().collection("changelog_lock").insertOne({ createdAt: new Date() });

    await expect(assertNoMigrationLock()).rejects.toThrow("Migrations verrouillées");
  });
});
