import { ObjectId } from "bson";
import { IOrganisationMissionLocale } from "shared/models";

import { missionLocaleStatsDb } from "@/common/model/collections";

import { getOrganisationById } from "../organisations.actions";

import { computeMissionLocaleStats } from "./mission-locale.actions";
import { computeMissionLocaleStatsV2 } from "./mission-locale.actions.v2";

export const createOrUpdateMissionLocaleStats = async (missionLocaleId: ObjectId) => {
  const ml = (await getOrganisationById(missionLocaleId)) as IOrganisationMissionLocale;
  const mlStats = await computeMissionLocaleStats(ml);

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

export const createOrUpdateMissionLocaleStatsV2 = async (missionLocaleId: ObjectId) => {
  const ml = (await getOrganisationById(missionLocaleId)) as IOrganisationMissionLocale;
  const mlStats = await computeMissionLocaleStatsV2(ml);

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
