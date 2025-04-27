import { ObjectId } from "bson";

import { missionLocaleEffectifsLogDb } from "@/common/model/collections";

export const createEffectifMissionLocaleLog = (missionLocaleEffectifId: ObjectId, data) => {
  return missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: missionLocaleEffectifId,
    created_at: new Date(),
    ...data,
  });
};
