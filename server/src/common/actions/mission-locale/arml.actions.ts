import { ObjectId } from "bson";

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
        localField: "_id",
        foreignField: "mission_locale_id",
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
      $project: {
        _id: 1,
        nom: 1,
        code_postal: "$adresse.code_postal",
        activated_at: 1,
        stats: "$stats.stats",
      },
    },
  ];

  return organisationsDb().aggregate(aggr).toArray();
};
