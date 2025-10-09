import { ObjectId } from "bson";
import { IUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";

import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

import { createOrUpdateMissionLocaleStats } from "../mission-locale/mission-locale-stats.actions";

export const setEffectifMissionLocaleDataFromOrganisme = async (
  organismeId: ObjectId,
  effectifId: ObjectId,
  data: IUpdateMissionLocaleEffectifOrganisme,
  userId?: ObjectId
) => {
  const { rupture, acc_conjoint, motif, commentaires } = data;

  const setObject = {
    rupture,
    acc_conjoint,
    reponse_at: new Date(),
    has_unread_notification: false,
    ...(userId ? { acc_conjoint_by: userId } : {}),
    ...(motif !== undefined ? { motif } : {}),
    ...(commentaires !== undefined ? { commentaires } : {}),
  };

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      "effectif_snapshot.organisme_id": organismeId,
      effectif_id: new ObjectId(effectifId),
      soft_deleted: { $ne: true },
    },
    {
      $set: {
        organisme_data: setObject,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  if (!updated.value) {
    throw new Error("Effectif not found or update failed");
  }
  await createOrUpdateMissionLocaleStats(updated.value?.mission_locale_id);
  return updated;
};

export const markEffectifNotificationAsRead = async (organismeId: ObjectId, effectifId: ObjectId, userId: ObjectId) => {
  const missionLocaleEffectif = await missionLocaleEffectifsDb().findOne({
    "effectif_snapshot.organisme_id": organismeId,
    effectif_id: new ObjectId(effectifId),
    "organisme_data.acc_conjoint_by": userId,
  });

  if (!missionLocaleEffectif) {
    return null;
  }

  await missionLocaleEffectifsLogDb().updateMany(
    {
      mission_locale_effectif_id: missionLocaleEffectif._id,
      read_by: { $ne: userId },
    },
    {
      $addToSet: { read_by: userId },
    }
  );

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      _id: missionLocaleEffectif._id,
    },
    {
      $set: {
        "organisme_data.has_unread_notification": false,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated;
};
