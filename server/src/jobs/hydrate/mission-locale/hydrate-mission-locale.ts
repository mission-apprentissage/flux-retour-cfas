import { ObjectId } from "mongodb";
import { IOrganisationMissionLocale } from "shared/models";

import {
  createMissionLocaleSnapshot,
  getAllEffectifForMissionLocaleCursor,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { organisationsDb } from "@/common/model/collections";

export const hydrateMissionLocaleSnapshot = async (missionLocaleStructureId: number | null) => {
  const cursor = organisationsDb().find({
    type: "MISSION_LOCALE",
    ...(missionLocaleStructureId ? { ml_id: missionLocaleStructureId } : {}),
  });

  while (await cursor.hasNext()) {
    const orga = (await cursor.next()) as IOrganisationMissionLocale;
    const cursor2 = getAllEffectifForMissionLocaleCursor(orga.ml_id);
    while (await cursor2.hasNext()) {
      const eff = await cursor2.next();
      if (eff) {
        await createMissionLocaleSnapshot(eff);
      }
    }
  }
};

export const hydrateMissionLocaleOrganisation = async () => {
  const allMl = await apiAlternanceClient.geographie.listMissionLocales({});
  const currentDate = new Date();
  for (const ml of allMl) {
    const missionLocale = await organisationsDb().findOne({ ml_id: ml.id });

    if (!missionLocale) {
      await organisationsDb().insertOne({
        _id: new ObjectId(),
        type: "MISSION_LOCALE",
        created_at: currentDate,
        ml_id: ml.id,
        nom: ml.nom,
        siret: ml.siret,
      });

      await hydrateMissionLocaleSnapshot(ml.id);
    }
  }
};
