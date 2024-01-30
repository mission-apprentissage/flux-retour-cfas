import { startOfDay, endOfDay } from "date-fns";

import { effectifsQueueDb } from "@/common/model/collections";

export const getTransmissionStatusByOrganismeGroupedByDate = async (
  organismeId: string,
  page: number = 1,
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

  if (!transmissions) {
    return {
      pagination: {
        page,
        limit,
        lastPage: page,
        total: 0,
      },
      data: [],
    };
  }
  if (transmissions?.pagination) {
    transmissions.pagination.lastPage = Math.ceil(transmissions.pagination.total / limit);
  }
  return transmissions;
};

export const getTransmissionStatusDetailsForAGivenDay = async (
  organismeId: string,
  day: string,
  page: number = 1,
  limit: number = 20
) => {
  const selectedDay = new Date(day);
  const start = startOfDay(selectedDay);
  const end = endOfDay(selectedDay);

  const transmissionsDetails = await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          source_organisme_id: organismeId,
          processed_at: {
            $gte: start,
            $lte: end,
          },
          validation_errors: {
            $exists: true,
          },
        },
      },
      {
        $sort: {
          processed_at: 1,
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

  if (!transmissionsDetails) {
    return {
      pagination: {
        page,
        limit,
        lastPage: page,
        total: 0,
      },
      data: [],
    };
  }

  if (transmissionsDetails?.pagination) {
    transmissionsDetails.pagination.lastPage = Math.ceil(transmissionsDetails.pagination.total / limit);
  }
  return transmissionsDetails;
};
