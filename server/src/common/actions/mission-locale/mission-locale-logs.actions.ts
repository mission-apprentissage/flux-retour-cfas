import { captureException } from "@sentry/node";
import { ObjectId } from "bson";

import { missionLocaleEffectifsLogDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

export const createEffectifMissionLocaleLog = (
  missionLocaleEffectifId: ObjectId | null | undefined,
  data: any,
  user: AuthContext
) => {
  if (!missionLocaleEffectifId || !data || !user) {
    captureException(new Error("createEffectifMissionLocaleLog: Missing required parameters"));
    return;
  }
  return missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    type: "MISSION_LOCALE",
    mission_locale_effectif_id: missionLocaleEffectifId,
    created_at: new Date(),
    created_by: user._id,
    read_by: [],
    ...data,
  });
};
