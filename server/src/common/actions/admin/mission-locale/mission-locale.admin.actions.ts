import { ObjectId } from "bson";

import { organisationsDb } from "@/common/model/collections";

export const activateMissionLocale = async (missionLocaleId: string, date: Date) => {
  const ml = await organisationsDb().findOne({ type: "MISSION_LOCALE", _id: new ObjectId(missionLocaleId) });

  if (!ml) {
    throw new Error(`Mission locale with id ${missionLocaleId} not found`);
  }

  await organisationsDb().updateOne(
    { _id: new ObjectId(missionLocaleId) },
    {
      $set: {
        activated_at: date,
      },
    }
  );
};
