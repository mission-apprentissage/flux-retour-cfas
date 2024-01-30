import { effectifsQueueDb } from "@/common/model/collections";

export const getTransmissionStatusByOrganismeGroupedByDate = async (
  organismeId: string,
  page: number = 0,
  limit: number = 20
) => {
  const transmissions = await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          source_organisme_id: organismeId,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$processed_at",
            },
          },
          total: {
            $sum: 1,
          },
          error: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $ifNull: ["$validation_errors", false],
                    },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
          success: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    {
                      $eq: [
                        {
                          $type: "$error",
                        },
                        "missing",
                      ],
                    },
                    {
                      $eq: [
                        {
                          $type: "$validation_errors",
                        },
                        "missing",
                      ],
                    },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id",
          success: "$success",
          error: "$error",
          total: "$total",
        },
      },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
    ])
    .next();
  if (transmissions?.pagination) {
    transmissions.pagination.lastPage = Math.ceil(transmissions.pagination.total / limit);
  }
  return transmissions;
};
