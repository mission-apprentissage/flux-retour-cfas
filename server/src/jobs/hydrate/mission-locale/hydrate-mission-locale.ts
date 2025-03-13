import { IOrganisationMissionLocale } from "shared/models";

import {
  createMissionLocaleSnapshot,
  getAllEffectifForMissionLocaleCursor,
} from "@/common/actions/mission-locale/mission-locale.actions";
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
