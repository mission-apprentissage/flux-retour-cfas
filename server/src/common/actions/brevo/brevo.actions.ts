import { brevoMissionLocaleListDb } from "@/common/model/collections";
import { BREVO_LISTE_TYPE } from "shared/models/data/brevoMissionLocaleList.model";

export const getOrCreateBrevoList = async (mission_locale_id: number, type: BREVO_LISTE_TYPE) => {
  const listId = await brevoMissionLocaleListDb().findOne({ mission_locale_id, type});

  // Create the list in db and brevo if not found
}
