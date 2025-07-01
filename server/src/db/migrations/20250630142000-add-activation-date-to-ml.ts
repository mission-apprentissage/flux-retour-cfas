import { ObjectId } from "mongodb";

import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  const cursor = organisationsDb().aggregate([
    {
      $match: {
        type: "MISSION_LOCALE",
        $or: [
          {
            activated_at: null,
          },
          {
            activated_at: {
              $exists: false,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "usersMigration",
        localField: "_id",
        foreignField: "organisation_id",
        as: "users",
      },
    },
    {
      $match: {
        "users.0": {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: "missionLocaleEffectif",
        localField: "_id",
        foreignField: "mission_locale_id",
        as: "users",
      },
    },
    {
      $sort: {
        "users.created_at": 1,
      },
    },
    {
      $addFields: {
        first_effectif_created_at: {
          $arrayElemAt: ["$users.created_at", 0],
        },
      },
    },
    {
      $project: {
        _id: 1,
        first_effectif_created_at: 1,
      },
    },
  ]);

  while (await cursor.hasNext()) {
    const mlOrganisation = await cursor.next();
    if (!mlOrganisation) continue;

    const { _id, first_effectif_created_at } =
      (mlOrganisation as unknown as { _id: ObjectId; first_effectif_created_at: Date }) || {};
    if (!first_effectif_created_at) {
      console.warn(`No effectif created date found for organisation ${_id}, skipping update.`);
      continue;
    }
    await organisationsDb().updateOne(
      { _id: _id },
      {
        $set: {
          activated_at: first_effectif_created_at || new Date(),
        },
      }
    );
    console.log(`Updated organisation ${_id} with activation date ${first_effectif_created_at}`);
  }
};
