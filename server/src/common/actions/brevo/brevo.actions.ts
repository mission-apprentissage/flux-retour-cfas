import { ObjectId } from "bson";
import { BREVO_LISTE_TYPE } from "shared/models/data/brevoMissionLocaleList.model";

import { brevoMissionLocaleListDb } from "@/common/model/collections";
import { createContactList } from "@/common/services/brevo/brevo";

export const getOrCreateBrevoList = async (
  mission_locale_id: number,
  mission_locale_name: string,
  type: BREVO_LISTE_TYPE
) => {
  const brevoListe = await brevoMissionLocaleListDb().findOne({ ml_id: mission_locale_id, type });

  if (!brevoListe) {
    const res = await createContactList(mission_locale_name);
    if (res?.response.statusCode !== 201) {
      throw new Error("Error creating Brevo list");
    }
    await brevoMissionLocaleListDb().insertOne({
      _id: new ObjectId(),
      ml_id: mission_locale_id,
      type,
      listId: res.body.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.body.id;
  }

  return brevoListe.listId;
};
