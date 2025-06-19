import { captureException } from "@sentry/node";

import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";

/**
 * purge de la collection effectifsQueue
 */
export const purgeQueues = async (NB_DAYS_TO_KEEP = 15) => {
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

  logger.info("End Purging effectifsQueue");
};
