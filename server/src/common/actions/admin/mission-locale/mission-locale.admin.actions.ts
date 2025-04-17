import { ObjectId } from "bson";
import { IOrganisationMissionLocale } from "shared/models";

import { organisationsDb } from "@/common/model/collections";

export const activateMissionLocale = async (missionLocaleId: ObjectId, date: Date, createOnly: boolean = false) => {
  const ml = await organisationsDb().findOne({
    type: "MISSION_LOCALE",
    _id: missionLocaleId,
    ...(createOnly ? { activated_at: { $exists: false } } : {}),
  });

  if (!ml) {
    return;
  }

  await organisationsDb().updateOne(
    { _id: missionLocaleId },
    {
      $set: {
        activated_at: date,
      },
    }
  );
};

export const getAllMlFromOrganisations = async (): Promise<Array<IOrganisationMissionLocale>> => {
  const mls = await organisationsDb()
    .find({
      type: "MISSION_LOCALE",
    })
    .toArray();

  return mls as Array<IOrganisationMissionLocale>;
};
