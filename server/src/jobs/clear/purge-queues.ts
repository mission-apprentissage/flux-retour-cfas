import { Filter, MongoServerError, MongoWriteConcernError, ObjectId } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";

import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";
import { sleep } from "@/common/utils/asyncUtils";
import { createErrorAggregator } from "@/common/utils/errorAggregator";

const DEFAULT_NB_DAYS_TO_KEEP = 15;
const DEFAULT_BATCH_SIZE = 5000;
const DEFAULT_SLEEP_MS = 200;
const MAX_EMPTY_BATCHES = 2;

export const PURGE_INDEX = { source_organisme_id: 1, organisme_id: 1, computed_day: 1 } as const;
const ORGANISME_INDEX = { organisme_id: 1 } as const;
const COMPUTED_DAY_INDEX = { computed_day: 1 } as const;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 30_000 } as const;
const PROCESSED = { $exists: true, $ne: null } as const;

type IndexHint = Record<string, 1 | -1>;
type BatchOptions = { batchSize?: number; sleepMs?: number };
type OrphanOptions = BatchOptions & { nbDaysToKeep?: number; mode?: "one-shot" | "nightly" };
type OrphanResult = { dated: number; undated: number; skipped: boolean };

const assertInteger = (name: string, value: number | undefined, min: number) => {
  if (value !== undefined && (!Number.isInteger(value) || value < min)) {
    throw new Error(`Option ${name} invalide : entier supérieur ou égal à ${min} attendu`);
  }
};

const assertOptions = ({ nbDaysToKeep, batchSize, sleepMs }: OrphanOptions) => {
  assertInteger("nbDaysToKeep", nbDaysToKeep, 1);
  assertInteger("batchSize", batchSize, 1);
  assertInteger("sleepMs", sleepMs, 0);
};

const hasPurgeIndex = async (): Promise<boolean> => {
  try {
    const indexes = await effectifsQueueDb().listIndexes().toArray();
    const expected = JSON.stringify(PURGE_INDEX);
    return indexes.some((index) => JSON.stringify(index.key) === expected);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 26) {
      return false;
    }
    throw error;
  }
};

export const deleteInBatches = async (
  filter: Filter<IEffectifQueue>,
  findHint: IndexHint,
  { batchSize = DEFAULT_BATCH_SIZE, sleepMs = DEFAULT_SLEEP_MS }: BatchOptions = {}
): Promise<number> => {
  let total = 0;
  let emptyBatches = 0;

  for (;;) {
    const docs = await effectifsQueueDb()
      .find(filter, { projection: { _id: 1 } })
      .hint(findHint)
      .limit(batchSize)
      .toArray();
    if (docs.length === 0) break;

    let deleted: number;
    try {
      const result = await effectifsQueueDb().deleteMany(
        { ...filter, _id: { $in: docs.map((doc) => doc._id) } } as Filter<IEffectifQueue>,
        { hint: { _id: 1 }, writeConcern: WRITE_CONCERN }
      );
      deleted = result.deletedCount;
    } catch (error) {
      if (error instanceof MongoWriteConcernError) {
        logger.error({ err: error, deleted: error.result?.n }, "Purge effectifsQueue : acquittement majority dépassé");
      }
      throw error;
    }

    total += deleted;
    emptyBatches = deleted === 0 ? emptyBatches + 1 : 0;
    if (emptyBatches >= MAX_EMPTY_BATCHES) {
      logger.warn({ filter }, "Purge effectifsQueue : deux lots consécutifs sans suppression, arrêt de la boucle");
      break;
    }

    await sleep(sleepMs);
  }

  return total;
};

export const purgeOrphanQueues = async (options: OrphanOptions = {}): Promise<OrphanResult> => {
  assertOptions(options);
  const { nbDaysToKeep = DEFAULT_NB_DAYS_TO_KEEP, batchSize, sleepMs, mode = "one-shot" } = options;

  if (!(await hasPurgeIndex())) {
    if (mode === "nightly") {
      logger.warn("Purge des orphelins d'effectifsQueue sautée : index composé absent");
      return { dated: 0, undated: 0, skipped: true };
    }
    throw new Error("Purge des orphelins d'effectifsQueue impossible : index composé absent");
  }

  const orphanSources = await effectifsQueueDb()
    .aggregate<{
      _id: string | null;
    }>([{ $match: { organisme_id: null } }, { $group: { _id: "$source_organisme_id" } }], { hint: PURGE_INDEX })
    .toArray();

  const errors = createErrorAggregator("purge-queues-orphans");
  let dated = 0;
  for (const { _id: source } of orphanSources) {
    if (!source) continue;
    try {
      const daysToDelete = await effectifsQueueDb()
        .aggregate<{ _id: string }>(
          [
            {
              $match: {
                organisme_id: null,
                source_organisme_id: source,
                computed_day: { $exists: true, $ne: null },
                processed_at: PROCESSED,
              },
            },
            { $group: { _id: "$computed_day" } },
            { $sort: { _id: -1 } },
            { $skip: nbDaysToKeep },
          ],
          { hint: PURGE_INDEX }
        )
        .toArray();

      const days = daysToDelete.map((day) => day._id);
      if (days.length === 0) continue;

      const deleted = await deleteInBatches(
        {
          organisme_id: null,
          source_organisme_id: source,
          computed_day: { $in: days },
          processed_at: PROCESSED,
        } as Filter<IEffectifQueue>,
        PURGE_INDEX,
        { batchSize, sleepMs }
      );
      dated += deleted;
      logger.info(`Purged ${deleted} orphan entries for source_organisme_id ${source}`);
    } catch (error) {
      if (error instanceof MongoWriteConcernError) throw error;
      logger.error({ err: error, source_organisme_id: source }, "Échec de la purge des orphelins pour une source");
      errors.record(error);
    }
  }

  let undated = 0;
  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - nbDaysToKeep);
    undated = await deleteInBatches(
      {
        organisme_id: null,
        computed_day: null,
        created_at: { $lt: cutoff },
        processed_at: PROCESSED,
      } as unknown as Filter<IEffectifQueue>,
      COMPUTED_DAY_INDEX,
      { batchSize, sleepMs }
    );
    logger.info(`Purged ${undated} undated orphan entries < ${cutoff.toISOString()}`);
  } catch (error) {
    if (error instanceof MongoWriteConcernError) throw error;
    logger.error({ err: error }, "Échec de la purge des orphelins non datés");
    errors.record(error);
  }

  const failed = errors.failed;
  errors.ok(orphanSources.length + 1 - failed);
  errors.flush();

  if (mode === "one-shot" && failed > 0) {
    throw new Error(
      `Purge des orphelins d'effectifsQueue incomplète : ${failed} échec(s), ${dated} datés et ${undated} non datés supprimés`
    );
  }

  return { dated, undated, skipped: false };
};

const purgeOrganismeQueues = async (nbDaysToKeep: number, batchOptions: BatchOptions) => {
  const organismes = await effectifsQueueDb().distinct("organisme_id");

  const errors = createErrorAggregator("purge-queues");
  for (const organismeId of organismes) {
    if (!organismeId) continue;
    try {
      const daysToDelete = await effectifsQueueDb()
        .aggregate<{ _id: string }>([
          {
            $match: {
              computed_day: { $exists: true, $ne: null },
              organisme_id: organismeId,
              processed_at: PROCESSED,
            },
          },
          { $group: { _id: "$computed_day" } },
          { $sort: { _id: -1 } },
          { $skip: nbDaysToKeep },
        ])
        .toArray();

      const days = daysToDelete.map((day) => day._id);
      if (days.length === 0) continue;

      const deleted = await deleteInBatches(
        { organisme_id: organismeId as ObjectId, computed_day: { $in: days } } as Filter<IEffectifQueue>,
        ORGANISME_INDEX,
        batchOptions
      );
      logger.info(`Deleted ${deleted} records for organisme_id: ${organismeId}`);
    } catch (error) {
      if (error instanceof MongoWriteConcernError) throw error;
      logger.error({ err: error, organisme_id: organismeId }, "Échec de la purge pour un organisme");
      errors.record(error);
    }
  }

  errors.ok(organismes.length - errors.failed);
  errors.flush();
};

export const purgeQueues = async (nbDaysToKeep = DEFAULT_NB_DAYS_TO_KEEP, batchOptions: BatchOptions = {}) => {
  assertOptions({ nbDaysToKeep, ...batchOptions });

  await purgeOrganismeQueues(nbDaysToKeep, batchOptions);
  await purgeOrphanQueues({ nbDaysToKeep, ...batchOptions, mode: "nightly" });

  logger.info("End Purging effectifsQueue");
};
