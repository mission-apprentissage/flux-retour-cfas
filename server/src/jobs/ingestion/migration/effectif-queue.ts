import { ObjectId } from "mongodb";

import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";
import { formatDateYYYYMMDD } from "@/common/utils/dateUtils";
import { createErrorAggregator } from "@/common/utils/errorAggregator";

export const updateEffectifQueueDateAndError = async () => {
  const BATCH_SIZE = 1000;
  const cursor = effectifsQueueDb().find({
    $or: [
      { has_error: { $exists: false } },
      { computed_day: { $exists: false } },
      { processed_at: { $exists: false } },
    ],
  });
  let batch: Array<{ _id: ObjectId; computed_day?: string; has_error: boolean }> = [];
  const errors = createErrorAggregator("migration-effectif-queue");

  const processBatch = (currentBatch: Array<{ _id: ObjectId; computed_day?: string; has_error: boolean }>) => {
    if (currentBatch.length === 0) {
      return;
    }

    try {
      const mapped = currentBatch.map(({ _id, computed_day, has_error }) => ({
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              computed_day,
              has_error,
            },
          },
        },
      }));

      return effectifsQueueDb().bulkWrite(mapped);
    } catch (e) {
      logger.error({ err: e }, "Échec du bulkWrite de migration effectifsQueue");
      errors.record(e);
    }
  };

  while (await cursor.hasNext()) {
    const eff = await cursor.next();
    if (!eff) {
      continue;
    }
    batch.push({
      _id: eff._id,
      computed_day: formatDateYYYYMMDD(eff?.processed_at),
      has_error: (!!eff.validation_errors && eff.validation_errors.length !== 0) || !!eff.error,
    });

    if (batch.length === BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  await processBatch(batch);
  errors.flush();
};
