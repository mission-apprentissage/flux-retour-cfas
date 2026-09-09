import { captureException } from "@sentry/node";
import { ObjectId } from "bson";
import { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import { missionLocaleEffectifsLogDb, organisationsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";

export const createEffectifMissionLocaleLog = async (
  missionLocaleEffectifId: ObjectId | null | undefined,
  data: Partial<IMissionLocaleEffectifLog>,
  user: AuthContext,
  missionLocaleId: ObjectId
) => {
  if (!missionLocaleEffectifId || !data || !user || !missionLocaleId) {
    captureException(new Error("createEffectifMissionLocaleLog: Missing required parameters"));
    return;
  }
  await missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: missionLocaleEffectifId,
    created_at: new Date(),
    created_by: user._id,
    read_by: [],
    ...data,
  });

  await organisationsDb().updateOne({ _id: missionLocaleId }, { $set: { derniere_activite: new Date() } });
};
