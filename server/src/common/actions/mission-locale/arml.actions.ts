import { ObjectId } from "bson";
import { IMissionLocaleStats } from "shared/models/data/missionLocaleStats.model";

import { organisationsDb } from "@/common/model/collections";

export const getMissionsLocalesByArml = async (armlId: ObjectId) => {
  const aggr = [
    {
      $match: {
        arml_id: armlId,
        type: "MISSION_LOCALE",
      },
    },
    {
      $lookup: {
        from: "missionLocaleStats",
        let: { ml_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$mission_locale_id", "$$ml_id"] },
            },
          },
          {
            $sort: { computed_day: -1 },
          },
          {
            $limit: 1,
          },
        ],
        as: "stats",
      },
    },
    {
      $unwind: {
        path: "$stats",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        stats: {
          $ifNull: [
            "$stats.stats",
            {
              total: 0,
              a_traiter: 0,
              traite: 0,
              sans_statut: 0,
              a_contacter: 0,
              autres: 0,
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        nom: 1,
        code_postal: "$adresse.code_postal",
        activated_at: 1,
        stats: 1,
      },
    },
  ];

  return organisationsDb().aggregate(aggr).toArray() as Promise<
    Array<{ _id: ObjectId; nom: string; code_postal: string; activated_at: Date; stats: IMissionLocaleStats["stats"] }>
  >;
};
