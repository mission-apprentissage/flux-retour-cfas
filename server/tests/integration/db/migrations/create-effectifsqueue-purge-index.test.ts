import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { up } from "@/db/migrations/20261117120400-create-effectifsqueue-purge-index";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const PURGE_INDEX_NAME = "source_organisme_id_1_organisme_id_1_computed_day_1";

const queueIndexNames = async () =>
  (await getDatabase().collection("effectifsQueue").listIndexes().toArray()).map(({ name }) => name);

describe("migration create-effectifsqueue-purge-index", () => {
  const dropQueueIndexes = () => getDatabase().collection("effectifsQueue").dropIndexes();
  beforeEach(dropQueueIndexes);
  afterEach(dropQueueIndexes);

  it("crée l'index composé et supprime les index simples qu'il couvre", async () => {
    const queue = getDatabase().collection("effectifsQueue");
    await queue.createIndex({ source_organisme_id: 1 }, { name: "source_organisme_id" });
    await queue.createIndex({ processed_at: 1 }, { name: "processed_at" });
    await queue.createIndex({ processed_at: 1, created_at: 1 });

    await up(getDatabase());
    await up(getDatabase());

    const names = await queueIndexNames();
    expect(names).toContain(PURGE_INDEX_NAME);
    expect(names).toContain("processed_at_1_created_at_1");
    expect(names).not.toContain("source_organisme_id");
    expect(names).not.toContain("processed_at");
  });

  it("garde processed_at quand l'index composé de l'ingestion manque", async () => {
    const queue = getDatabase().collection("effectifsQueue");
    await queue.createIndex({ processed_at: 1 }, { name: "processed_at" });

    await up(getDatabase());

    const names = await queueIndexNames();
    expect(names).toContain(PURGE_INDEX_NAME);
    expect(names).toContain("processed_at");
  });
});
