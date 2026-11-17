import type { IJobsSimple } from "job-processor";
import { Collection, MongoWriteConcernError, ObjectId } from "mongodb";
import effectifsQueueDescriptor from "shared/models/data/effectifsQueue.model";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { effectifsQueueDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { ingestionJobs } from "../registry/ingestion";

import { PURGE_INDEX, purgeOrphanQueues, purgeQueues } from "./purge-queues";

useMongo();

const NB_DAYS_TO_KEEP = 15;
const FAST = { sleepMs: 0 };
const PURGE_INDEX_NAME = Object.entries(PURGE_INDEX)
  .map(([key, order]) => `${key}_${order}`)
  .join("_");

const day = (d: number) => `2026-01-${String(d).padStart(2, "0")}`;
const oldDay = (d: number) => `2025-01-${String(d).padStart(2, "0")}`;

const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

const realOrganismeId = new ObjectId();

type QueueDoc = {
  organisme_id: ObjectId | null;
  source_organisme_id: string | null;
  computed_day?: string;
  processed_at?: Date;
  created_at: Date;
};

const insertQueueDocs = async (docs: QueueDoc[]) => {
  await effectifsQueueDb().insertMany(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    docs as any[],
    { bypassDocumentValidation: true }
  );
};

const countFor = (filter: object) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  effectifsQueueDb().countDocuments(filter as any);

const createQueueIndexes = async () => {
  for (const [keys, options] of effectifsQueueDescriptor.indexes) {
    await effectifsQueueDb().createIndex(keys, options);
  }
};

const writeConcernError = () =>
  Object.assign(Object.create(MongoWriteConcernError.prototype), {
    message: "waiting for replication timed out",
    result: { n: 3 },
  }) as MongoWriteConcernError;

describe("purge d'effectifsQueue", () => {
  beforeAll(async () => {
    await createQueueIndexes();
  });

  beforeEach(async () => {
    const docs: QueueDoc[] = [];

    for (let d = 1; d <= 20; d++) {
      docs.push({
        organisme_id: realOrganismeId,
        source_organisme_id: "srcReal",
        computed_day: day(d),
        processed_at: new Date(),
        created_at: new Date(),
      });
    }

    for (let d = 1; d <= 20; d++) {
      for (let i = 0; i < 2; i++) {
        docs.push({
          organisme_id: null,
          source_organisme_id: "srcA",
          computed_day: day(d),
          processed_at: new Date(),
          created_at: new Date(),
        });
      }
    }

    for (let d = 1; d <= 10; d++) {
      docs.push({
        organisme_id: null,
        source_organisme_id: "srcB",
        computed_day: oldDay(d),
        processed_at: new Date(),
        created_at: new Date(),
      });
    }

    docs.push({ organisme_id: null, source_organisme_id: "srcU", processed_at: daysAgo(40), created_at: daysAgo(40) });
    docs.push({ organisme_id: null, source_organisme_id: "srcU", processed_at: daysAgo(5), created_at: daysAgo(5) });

    await insertQueueDocs(docs);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await createQueueIndexes();
  });

  it("garde les 15 derniers jours d'un organisme et supprime les plus anciens", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP, FAST);

    const kept = await effectifsQueueDb().distinct("computed_day", { organisme_id: realOrganismeId });
    expect(kept.sort()).toEqual(Array.from({ length: 15 }, (_, i) => day(i + 6)));
    expect(await countFor({ organisme_id: realOrganismeId, computed_day: day(5) })).toBe(0);
    expect(await countFor({ organisme_id: realOrganismeId, computed_day: day(6) })).toBe(1);
  });

  it("purge un organisme en plusieurs lots", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP, { batchSize: 1, sleepMs: 0 });

    expect(await countFor({ organisme_id: realOrganismeId })).toBe(15);
  });

  it("garde les 15 derniers jours des orphelins par source", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP, FAST);

    const keptA = (await effectifsQueueDb().distinct("computed_day", {
      organisme_id: null,
      source_organisme_id: "srcA",
    })) as string[];
    expect(keptA.sort()).toEqual(Array.from({ length: 15 }, (_, i) => day(i + 6)));
    expect(await countFor({ source_organisme_id: "srcA", computed_day: day(1) })).toBe(0);
    expect(await countFor({ source_organisme_id: "srcA", computed_day: day(20) })).toBe(2);
  });

  it("garde tous les orphelins d'une source qui a moins de 15 jours, même anciens", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP, FAST);

    expect(await countFor({ source_organisme_id: "srcB" })).toBe(10);
  });

  it("supprime les orphelins sans jour de plus de 15 jours et garde les récents", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP, FAST);

    const remaining = await effectifsQueueDb().find({ source_organisme_id: "srcU" }).toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].created_at.getTime()).toBeGreaterThan(daysAgo(15).getTime());
  });

  it("ne supprime jamais un orphelin non traité", async () => {
    await insertQueueDocs([
      { organisme_id: null, source_organisme_id: "srcA", computed_day: day(1), created_at: daysAgo(300) },
      { organisme_id: null, source_organisme_id: "srcP", created_at: daysAgo(300) },
    ]);

    await purgeQueues(NB_DAYS_TO_KEEP, FAST);

    expect(await countFor({ source_organisme_id: "srcA", computed_day: day(1) })).toBe(1);
    expect(await countFor({ source_organisme_id: "srcP" })).toBe(1);
  });

  it("purge les orphelins en plusieurs lots", async () => {
    const result = await purgeOrphanQueues({ batchSize: 1, sleepMs: 0 });

    expect(result).toEqual({ dated: 10, undated: 1, skipped: false });
    expect(await countFor({ source_organisme_id: "srcA" })).toBe(30);
  });

  it("continue quand l'agrégation d'une source échoue", async () => {
    const realAggregate = Collection.prototype.aggregate;
    vi.spyOn(Collection.prototype, "aggregate").mockImplementation(function (this: Collection, ...args) {
      const pipeline = args[0] as Array<{ $match?: { source_organisme_id?: string } }>;
      if (pipeline[0]?.$match?.source_organisme_id === "srcA") {
        throw new Error("boom");
      }
      return realAggregate.apply(this, args);
    });

    await expect(purgeQueues(NB_DAYS_TO_KEEP, FAST)).resolves.toBeUndefined();
    vi.restoreAllMocks();

    expect(await countFor({ source_organisme_id: "srcA" })).toBe(40);
    expect(await countFor({ source_organisme_id: "srcU" })).toBe(1);
  });

  it("échoue en one-shot quand une source échoue, après avoir purgé les autres", async () => {
    const realAggregate = Collection.prototype.aggregate;
    vi.spyOn(Collection.prototype, "aggregate").mockImplementation(function (this: Collection, ...args) {
      const pipeline = args[0] as Array<{ $match?: { source_organisme_id?: string } }>;
      if (pipeline[0]?.$match?.source_organisme_id === "srcA") {
        throw new Error("boom");
      }
      return realAggregate.apply(this, args);
    });

    await expect(purgeOrphanQueues(FAST)).rejects.toThrow("incomplète : 1 échec(s), 0 datés et 1 non datés supprimés");
    vi.restoreAllMocks();

    expect(await countFor({ source_organisme_id: "srcA" })).toBe(40);
    expect(await countFor({ source_organisme_id: "srcU" })).toBe(1);
  });

  it("échoue quand l'acquittement majority est dépassé", async () => {
    vi.spyOn(Collection.prototype, "deleteMany").mockRejectedValue(writeConcernError());

    await expect(purgeQueues(NB_DAYS_TO_KEEP, FAST)).rejects.toBeInstanceOf(MongoWriteConcernError);
    await expect(purgeOrphanQueues(FAST)).rejects.toBeInstanceOf(MongoWriteConcernError);
  });

  it("s'arrête après deux lots consécutifs sans suppression", async () => {
    const deleteMany = vi
      .spyOn(Collection.prototype, "deleteMany")
      .mockResolvedValue({ acknowledged: true, deletedCount: 0 });

    const result = await purgeOrphanQueues(FAST);

    expect(result).toEqual({ dated: 0, undated: 0, skipped: false });
    expect(deleteMany).toHaveBeenCalledTimes(4);
  });

  it("continue après un seul lot sans suppression", async () => {
    const realDeleteMany = Collection.prototype.deleteMany;
    let calls = 0;
    vi.spyOn(Collection.prototype, "deleteMany").mockImplementation(function (this: Collection, ...args) {
      calls += 1;
      if (calls === 1) {
        return Promise.resolve({ acknowledged: true, deletedCount: 0 });
      }
      return realDeleteMany.apply(this, args);
    });

    const result = await purgeOrphanQueues(FAST);

    expect(result).toEqual({ dated: 10, undated: 1, skipped: false });
  });

  it("saute les orphelins en passe nocturne quand l'index composé manque", async () => {
    await effectifsQueueDb().dropIndex(PURGE_INDEX_NAME);

    await expect(purgeQueues(NB_DAYS_TO_KEEP, FAST)).resolves.toBeUndefined();

    expect(await countFor({ organisme_id: realOrganismeId })).toBe(15);
    expect(await countFor({ source_organisme_id: "srcA" })).toBe(40);
    expect(await countFor({ source_organisme_id: "srcU" })).toBe(2);
  });

  it("échoue en one-shot quand l'index composé manque", async () => {
    await effectifsQueueDb().dropIndex(PURGE_INDEX_NAME);

    await expect(purgeOrphanQueues(FAST)).rejects.toThrow("index composé absent");
    expect(await countFor({ source_organisme_id: "srcA" })).toBe(40);
  });

  it.each([
    { batchSize: 0 },
    { batchSize: Number.NaN },
    { batchSize: 1.5 },
    { nbDaysToKeep: 0 },
    { nbDaysToKeep: Number.NaN },
    { sleepMs: -1 },
  ])("refuse les options invalides %o", async (options) => {
    await expect(purgeOrphanQueues(options)).rejects.toThrow("invalide");
    expect(await countFor({ source_organisme_id: "srcA" })).toBe(40);
  });

  it("refuse un nombre de jours invalide en passe nocturne", async () => {
    await expect(purgeQueues(Number.NaN)).rejects.toThrow("invalide");
    expect(await countFor({ organisme_id: realOrganismeId })).toBe(20);
  });

  it("lance la purge des orphelins par le job clear:queue-orphans", async () => {
    const job = { payload: { batchSize: "1", sleepMs: 0, nbDaysToKeep: 15 } } as unknown as IJobsSimple;

    const handler = ingestionJobs["clear:queue-orphans"].handler as (
      job: IJobsSimple,
      signal: AbortSignal
    ) => Promise<unknown>;

    const result = await handler(job, new AbortController().signal);

    expect(result).toEqual({ dated: 10, undated: 1, skipped: false });
  });

  it("ne supprime plus rien au second passage", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP, FAST);
    const after1 = await effectifsQueueDb().countDocuments({});

    await purgeQueues(NB_DAYS_TO_KEEP, FAST);

    expect(await effectifsQueueDb().countDocuments({})).toBe(after1);
  });
});
