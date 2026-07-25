import { captureException } from "@sentry/node";
import { Filter } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";

import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";
import { getMongodbClient } from "@/common/mongodb";
import { sleep } from "@/common/utils/asyncUtils";

const DEFAULT_NB_DAYS_TO_KEEP = 15;
const DEFAULT_BATCH_SIZE = 5000;
const DEFAULT_SLEEP_MS = 200;
const DEFAULT_MAX_SECONDARY_LAG_MS = 10_000;

type BatchOptions = { batchSize?: number; sleepMs?: number };

/**
 * Avorte si un secondary dépasse le seuil de lag de réplication
 */
export const checkSecondaryLag = async (maxLagMs = DEFAULT_MAX_SECONDARY_LAG_MS): Promise<void> => {
  let status: any;
  try {
    status = await getMongodbClient().db().admin().command({ replSetGetStatus: 1 });
  } catch (error: any) {
    // Hors replica set (dev/test) : rien à surveiller → no-op silencieux.
    if (error?.code === 76 /* NoReplicationEnabled */ || error?.code === 94 /* NotYetInitialized */) {
      return;
    }
    // Tout autre échec (ex. transitoire en prod) désactive la protection de lag : on continue
    // la purge (fail-open volontaire pour ne pas bloquer sur un monitoring flaky), mais on le
    // rend VISIBLE plutôt que de l'avaler en silence.
    logger.warn({ err: error }, "checkSecondaryLag: replSetGetStatus failed, skipping lag check for this batch");
    return;
  }

  const members: any[] = status?.members ?? [];
  const primary = members.find((m) => m.stateStr === "PRIMARY");
  if (!primary?.optimeDate) return;

  const primaryTime = new Date(primary.optimeDate).getTime();
  let maxLag = 0;
  for (const member of members) {
    if (member.stateStr !== "SECONDARY" || !member.optimeDate) continue;
    const lag = primaryTime - new Date(member.optimeDate).getTime();
    if (lag > maxLag) maxLag = lag;
  }

  if (maxLag > maxLagMs) {
    throw new Error(`Secondary replication lag ${maxLag}ms exceeds threshold ${maxLagMs}ms — aborting purge`);
  }
};

/**
 * Supprime par lots bornés (curseur `_id`), respire entre chaque lot, et avorte si le lag
 * des secondaries dépasse le seuil. Partagé entre la passe quotidienne et le one-shot
 * CLI : aucun `deleteMany` massif ne subsiste, quelle que soit la taille du backlog
 */
export const deleteInBatches = async (
  filter: Filter<IEffectifQueue>,
  { batchSize = DEFAULT_BATCH_SIZE, sleepMs = DEFAULT_SLEEP_MS }: BatchOptions = {}
): Promise<number> => {
  let lastId: unknown = null;
  let total = 0;

  for (;;) {
    const ids = await effectifsQueueDb()
      .find({ ...filter, ...(lastId ? { _id: { $gt: lastId } } : {}) } as Filter<IEffectifQueue>, {
        projection: { _id: 1 },
      })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();

    if (ids.length === 0) break;

    const res = await effectifsQueueDb().deleteMany({ _id: { $in: ids.map((d) => d._id) } });
    total += res.deletedCount ?? 0;
    lastId = ids[ids.length - 1]._id;

    await checkSecondaryLag();
    await sleep(sleepMs);
  }

  return total;
};

/**
 * Passe orphelins : docs sans `organisme_id` (résolution du destinataire échouée à
 * l'ingestion), jamais atteints par la boucle par-organisme de `purgeQueues`. On leur
 * applique la MÊME règle de rétention, keyée `source_organisme_id` (symétrie succès/erreurs) :
 * on garde les 15 derniers `computed_day` par source. Un filet calendaire `created_at` couvre
 * les orphelins non datables (sans `computed_day`). Batché + lag-aware.
 */
export const purgeOrphanQueues = async ({
  nbDaysToKeep = DEFAULT_NB_DAYS_TO_KEEP,
  batchSize,
  sleepMs,
}: { nbDaysToKeep?: number } & BatchOptions = {}): Promise<{ dated: number; undated: number }> => {
  const orphanSources = await effectifsQueueDb().distinct("source_organisme_id", { organisme_id: null });

  let dated = 0;
  for (const src of orphanSources) {
    if (!src) continue;
    try {
      const daysToDelete = await effectifsQueueDb()
        .aggregate([
          {
            $match: {
              organisme_id: null,
              source_organisme_id: src,
              computed_day: { $exists: true, $ne: null },
              processed_at: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: "$computed_day" } },
          { $sort: { _id: -1 } }, // tri lexical sur computed_day (string ISO triable)
          { $skip: nbDaysToKeep },
        ])
        .toArray();

      const days = daysToDelete.map((d) => d._id);
      if (days.length === 0) continue;

      const deleted = await deleteInBatches(
        { organisme_id: null, source_organisme_id: src, computed_day: { $in: days } },
        { batchSize, sleepMs }
      );
      dated += deleted;
      logger.info(`Purged ${deleted} orphan entries for source_organisme_id ${src}`);
    } catch (error) {
      captureException(error);
      continue; // une source en échec ne doit pas avorter la passe ni le filet
    }
  }

  // Filet : orphelins SANS computed_day (non datables par jour) → cutoff calendaire created_at
  // pour éviter qu'ils ne s'accumulent (même classe de bug que le bucket initial).
  let undated = 0;
  try {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - nbDaysToKeep);
    undated = await deleteInBatches(
      // computed_day: null matche null ET absent en Mongo (le type zod est string | undefined → cast)
      { organisme_id: null, computed_day: null, created_at: { $lt: cutoff } } as unknown as Filter<IEffectifQueue>,
      { batchSize, sleepMs }
    );
    logger.info(`Purged ${undated} undated orphan entries < ${cutoff.toISOString()}`);
  } catch (error) {
    captureException(error);
  }

  return { dated, undated };
};

/**
 * purge de la collection effectifsQueue
 */
export const purgeQueues = async (NB_DAYS_TO_KEEP = DEFAULT_NB_DAYS_TO_KEEP) => {
  const organisme = await effectifsQueueDb().distinct("organisme_id");

  if (organisme.length === 0) {
    logger.info("No organisme found in effectifsQueue, nothing to purge.");
    return;
  }

  for (const org of organisme) {
    try {
      if (!org) {
        continue;
      }

      const aggregation = [
        {
          $match: {
            computed_day: {
              $exists: true,
              $ne: null,
            },
            organisme_id: org,
            processed_at: {
              $exists: true,
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$computed_day",
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $skip: NB_DAYS_TO_KEEP,
        },
      ];

      const daysToDelete = await effectifsQueueDb().aggregate(aggregation).toArray();
      const daysToDeleteFormatted = daysToDelete.map((day) => day._id);

      if (daysToDeleteFormatted.length === 0) {
        logger.info(`No days to delete for organisme_id: ${org}`);
        continue;
      }

      const deleteResult = await effectifsQueueDb().deleteMany({
        organisme_id: org,
        computed_day: { $in: daysToDeleteFormatted },
      });
      logger.info(`Deleted ${deleteResult.deletedCount} records for organisme_id: ${org}`);
    } catch (error) {
      captureException(error);
      continue;
    }
  }

  await purgeOrphanQueues({ nbDaysToKeep: NB_DAYS_TO_KEEP });

  logger.info("End Purging effectifsQueue");
};
