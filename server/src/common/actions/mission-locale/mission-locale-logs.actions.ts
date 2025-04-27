import { ObjectId } from "bson";
import { IUpdateMissionLocaleEffectif } from "shared/models";

import { missionLocaleEffectifsLogDb } from "@/common/model/collections";

export const createEffectifMissionLocaleLog = (
  missionLocaleEffectifId: ObjectId,
  data: IUpdateMissionLocaleEffectif
) => {
  return missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: missionLocaleEffectifId,
    created_at: new Date(),
    ...data,
  });
};
