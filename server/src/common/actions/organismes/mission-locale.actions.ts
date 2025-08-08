import { ObjectId } from "bson";
import { API_EFFECTIF_LISTE, IOrganisationMissionLocale, IOrganisationOrganismeFormation } from "shared/models";
import { IEffectifsParMoisFiltersMissionLocaleSchema } from "shared/models/routes/mission-locale/missionLocale.api";
import { IUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import { createOrUpdateMissionLocaleStats } from "../mission-locale/mission-locale-stats.actions";
import { getEffectifsParMoisByMissionLocaleId } from "../mission-locale/mission-locale.actions";

export const setEffectifMissionLocaleDataFromOrganisme = async (
  organismeId: ObjectId,
  effectifId: ObjectId,
  data: IUpdateMissionLocaleEffectifOrganisme
) => {
  const { rupture, acc_conjoint, motif, commentaires } = data;

  const setObject = {
    rupture,
    acc_conjoint,
    reponse_at: new Date(),
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

export async function getAllEffectifsParMois(
  organisation: IOrganisationMissionLocale | IOrganisationOrganismeFormation,
  activationDate?: Date
) {
  const fetchByType = (type: API_EFFECTIF_LISTE) =>
    getEffectifsParMoisByMissionLocaleId(
      organisation,
      { type } as IEffectifsParMoisFiltersMissionLocaleSchema,
      activationDate
    );

  const [a_traiter, traite] = await Promise.all([
    fetchByType(API_EFFECTIF_LISTE.A_TRAITER),
    fetchByType(API_EFFECTIF_LISTE.TRAITE),
  ]);

  return { a_traiter, traite };
}
