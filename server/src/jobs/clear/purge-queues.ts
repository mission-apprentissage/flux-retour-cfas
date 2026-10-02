import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";
import { createErrorAggregator } from "@/common/utils/errorAggregator";

/**
 * purge de la collection effectifsQueue
 */
export const purgeQueues = async (NB_DAYS_TO_KEEP = 15) => {
  const organisme = await effectifsQueueDb().distinct("organisme_id");

  if (organisme.length === 0) {
    logger.info("No organisme found in effectifsQueue, nothing to purge.");
    return;
  }

  const errors = createErrorAggregator("purge-queues");
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
      logger.error({ err: error, organisme_id: org }, "Échec de la purge pour un organisme");
      errors.record(error);
      continue;
    }
  }

  errors.ok(organisme.length - errors.failed);
  errors.flush();
  logger.info("End Purging effectifsQueue");
};
