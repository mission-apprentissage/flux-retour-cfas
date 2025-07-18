import { ObjectId } from "bson";
import { IUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import { createOrUpdateMissionLocaleStats } from "../mission-locale/mission-locale-stats.actions";

export const setEffectifMissionLocaleDataFromOrganisme = async (
  organismeId: ObjectId,
  effectifId: ObjectId,
  data: IUpdateMissionLocaleEffectifOrganisme
) => {
  const { rupture, acc_conjoint, motif, commentaires } = data;

  const setObject = {
    rupture,
    acc_conjoint,
    ...(motif !== undefined ? { motif } : []),
    ...(commentaires !== undefined ? { commentaires } : {}),
  };

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      "effectif_snapshot.organisme_id": organismeId,
      effectif_id: new ObjectId(effectifId),
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
