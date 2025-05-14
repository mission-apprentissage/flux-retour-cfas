import { ObjectId } from "bson";
import { IOrganisationMissionLocale } from "shared/models";

import { organisationsDb } from "@/common/model/collections";
import { updateEffectifMissionLocaleSnapshotAtActivation } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";

export const activateMissionLocaleAtFirstInvitation = async (missionLocaleId: ObjectId, date: Date) => {
  const ml = await organisationsDb()
    .aggregate([
      {
        $match: {
          type: "MISSION_LOCALE",
          _id: missionLocaleId,
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
            $exists: false,
          },
        },
      },
    ])
    .next();

  if (!ml) {
    return;
  }

  await activateMissionLocale(missionLocaleId, date);
};

export const activateMissionLocale = async (missionLocaleId: ObjectId, date: Date) => {
  await organisationsDb().updateOne(
    { _id: new ObjectId(missionLocaleId) },
    {
      $set: {
        activated_at: date,
      },
    }
  );

  await updateEffectifMissionLocaleSnapshotAtActivation(missionLocaleId);
};

export const getAllMlFromOrganisations = async (): Promise<Array<IOrganisationMissionLocale>> => {
  const mls = await organisationsDb()
    .find({
      type: "MISSION_LOCALE",
    })
    .toArray();

  return mls as Array<IOrganisationMissionLocale>;
};
