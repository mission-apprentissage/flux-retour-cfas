import { ObjectId } from "bson";
import { IOrganisationMissionLocale } from "shared/models";

import { missionLocaleStatsDb } from "@/common/model/collections";

import { getOrganisationById } from "../organisations.actions";

import { computeMissionLocaleStats } from "./mission-locale.actions";

export const createOrUpdateMissionLocaleStats = async (missionLocaleId: ObjectId) => {
  const ml = (await getOrganisationById(missionLocaleId)) as IOrganisationMissionLocale;
  const mlStats = await computeMissionLocaleStats(ml._id, ml.activated_at);

  await missionLocaleStatsDb().findOneAndUpdate(
    {
      mission_locale_id: missionLocaleId,
    },
    {
      $set: {
        stats: mlStats,
        updated_at: new Date(),
      },
      $setOnInsert: {
        mission_locale_id: ml._id,
        created_at: new Date(),
        _id: new ObjectId(),
      },
    },
    {
      upsert: true,
    }
  );
};
