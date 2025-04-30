import { ObjectId } from "bson";

import { missionLocaleEffectifsLogDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

export const createEffectifMissionLocaleLog = (missionLocaleEffectifId: ObjectId, data: any, user: AuthContext) => {
  return missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: missionLocaleEffectifId,
    created_at: new Date(),
    created_by: user._id,
    ...data,
  });
};
