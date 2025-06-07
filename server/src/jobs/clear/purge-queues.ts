import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";

/**
 * purge de la collection effectifsQueue
 */
export const purgeQueues = async (NB_DAYS_TO_KEEP = 15) => {
  const aggregationPipeline = [
    {
      $match: {
        computed_day: {
          $exists: true,
          $ne: null,
        },
        organisme_id: {
          $exists: true,
          $ne: null,
        },
      },
    },
    {
      $group: {
        _id: {
          organisme_id: "$organisme_id",
          computed_day: "$computed_day",
        },
        records: {
          $push: "$$ROOT",
        },
      },
    },
    {
      $group: {
        _id: "$_id.organisme_id",
        allDates: {
          $push: {
            date: "$_id.computed_day",
            records: "$records",
          },
        },
      },
    },
    {
      $project: {
        organisme_id: "$_id",
        sortedDates: {
          $sortArray: {
            input: "$allDates",
            sortBy: {
              date: -1,
            },
          },
        },
      },
    },
    {
      $project: {
        organisme_id: 1,
        datesToDelete: {
          $cond: {
            if: {
              $gt: [
                {
                  $size: "$sortedDates",
                },
                NB_DAYS_TO_KEEP,
              ],
            },
            then: {
              $slice: [
                "$sortedDates",
                NB_DAYS_TO_KEEP,
                {
                  $subtract: [
                    {
                      $size: "$sortedDates",
                    },
                    NB_DAYS_TO_KEEP,
                  ],
                },
              ],
            },
            else: [],
          },
        },
      },
    },
    {
      $match: {
        "datesToDelete.0": {
          $exists: true,
        },
      },
    },
    {
      $unwind: "$datesToDelete",
    },
    {
      $unwind: "$datesToDelete.records",
    },
    {
      $replaceRoot: {
        newRoot: "$datesToDelete.records",
      },
    },
    {
      $project: {
        _id: 1,
      },
    },
  ];

  const recordsToDelete = await effectifsQueueDb().aggregate(aggregationPipeline).toArray();
  const idsToDelete = recordsToDelete.map((record) => record._id);

  if (idsToDelete.length > 0) {
    const deleteResult = await effectifsQueueDb().deleteMany({ _id: { $in: idsToDelete } });
    logger.info(`Deleted ${deleteResult.deletedCount} records from effectifsQueue`);
  } else {
    logger.info("No records to delete from effectifsQueue.");
  }

  logger.info("End Purging effectifsQueue");
};
