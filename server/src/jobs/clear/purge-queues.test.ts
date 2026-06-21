import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { effectifsQueueDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { purgeQueues } from "./purge-queues";

useMongo();

const NB_DAYS_TO_KEEP = 15;

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
    docs.map((d) => ({ ...d, created_at: d.created_at ?? new Date() })) as any[],
    { bypassDocumentValidation: true }
  );
};

const countFor = (filter: object) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  effectifsQueueDb().countDocuments(filter as any);

describe("purgeQueues — passe orphelins (symétrie + filet)", () => {
  beforeEach(async () => {
    const docs: QueueDoc[] = [];

    // (préservé) vrai organisme : 20 jours datés → garde 15 derniers, supprime 5 plus anciens
    for (let d = 1; d <= 20; d++) {
      docs.push({
        organisme_id: realOrganismeId,
        source_organisme_id: "srcReal",
        computed_day: day(d),
        processed_at: new Date(),
        created_at: new Date(),
      });
    }

    // orphelin source A : 20 jours datés (2 docs/jour) → garde 15 derniers PAR source, supprime 5
    for (let d = 1; d <= 20; d++) {
      docs.push(
        {
          organisme_id: null,
          source_organisme_id: "srcA",
          computed_day: day(d),
          processed_at: new Date(),
          created_at: new Date(),
        },
        {
          organisme_id: null,
          source_organisme_id: "srcA",
          computed_day: day(d),
          processed_at: new Date(),
          created_at: new Date(),
        }
      );
    }

    // orphelin source B : 10 jours datés ANCIENS (≤ 15) → tous conservés (même vieux)
    for (let d = 1; d <= 10; d++) {
      docs.push({
        organisme_id: null,
        source_organisme_id: "srcB",
        computed_day: oldDay(d),
        processed_at: new Date(),
        created_at: new Date(),
      });
    }

    // orphelins NON datés (filet calendaire created_at)
    docs.push({ organisme_id: null, source_organisme_id: "srcU", created_at: daysAgo(40) }); // > 15j → supprimé
    docs.push({ organisme_id: null, source_organisme_id: "srcU", created_at: daysAgo(5) }); // < 15j → conservé

    await insertQueueDocs(docs);
  });

  it("(a) un vrai organisme garde ses 15 derniers computed_day, supprime les plus anciens", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP);

    const kept = await effectifsQueueDb().distinct("computed_day", { organisme_id: realOrganismeId });
    expect(kept).toHaveLength(15);
    // (e) tri LEXICAL : les 15 jours lexicalement les plus grands sont conservés (06 → 20)
    expect(kept.sort()).toEqual(Array.from({ length: 15 }, (_, i) => day(i + 6)));
    expect(await countFor({ organisme_id: realOrganismeId, computed_day: day(5) })).toBe(0);
    expect(await countFor({ organisme_id: realOrganismeId, computed_day: day(6) })).toBe(1);
  });

  it("(b)(c)(e) orphelins datés : garde les 15 derniers computed_day par source, supprime au-delà", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP);

    const keptA = (await effectifsQueueDb().distinct("computed_day", {
      organisme_id: null,
      source_organisme_id: "srcA",
    })) as string[];
    expect(keptA).toHaveLength(15);
    // (e) ce sont bien les 15 lexicalement max (06 → 20), pas les 15 premiers insérés
    expect(keptA.sort()).toEqual(Array.from({ length: 15 }, (_, i) => day(i + 6)));
    // (c) jours au-delà supprimés (les 2 docs du jour partent)
    expect(await countFor({ source_organisme_id: "srcA", computed_day: day(1) })).toBe(0);
    // jours conservés : 2 docs/jour intacts
    expect(await countFor({ source_organisme_id: "srcA", computed_day: day(20) })).toBe(2);
  });

  it("(b) orphelins datés anciens mais ≤ 15 jours/source : tous conservés (même vieux)", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP);

    expect(await countFor({ source_organisme_id: "srcB" })).toBe(10);
  });

  it("(d) filet : orphelins sans computed_day supprimés si created_at > 15j, conservés sinon", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP);

    const remaining = await effectifsQueueDb().find({ source_organisme_id: "srcU" }).toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].created_at.getTime()).toBeGreaterThan(daysAgo(15).getTime());
  });

  it("(f) une source qui jette n'avorte ni la passe ni le filet", async () => {
    const realAggregate = effectifsQueueDb().aggregate.bind(effectifsQueueDb());
    let threw = false;
    const spy = vi.spyOn(effectifsQueueDb(), "aggregate").mockImplementation((...args: unknown[]) => {
      if (!threw) {
        threw = true;
        return {
          toArray: () => Promise.reject(new Error("boom: source corrompue")),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return realAggregate(...(args as [any]));
    });

    try {
      await expect(purgeQueues(NB_DAYS_TO_KEEP)).resolves.not.toThrow();
    } finally {
      spy.mockRestore();
    }

    const remainingUndated = await effectifsQueueDb().find({ source_organisme_id: "srcU" }).toArray();
    expect(remainingUndated).toHaveLength(1);
    expect(remainingUndated[0].created_at.getTime()).toBeGreaterThan(daysAgo(15).getTime());
  });

  it("est idempotent : un 2e passage ne supprime plus rien", async () => {
    await purgeQueues(NB_DAYS_TO_KEEP);
    const after1 = await effectifsQueueDb().countDocuments({});

    await purgeQueues(NB_DAYS_TO_KEEP);
    const after2 = await effectifsQueueDb().countDocuments({});

    expect(after2).toBe(after1);
  });
});
