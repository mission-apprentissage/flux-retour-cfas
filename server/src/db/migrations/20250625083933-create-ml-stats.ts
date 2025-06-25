import { IOrganisationMissionLocale } from "shared/models";

import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  const mls = (await organisationsDb().find({ type: "MISSION_LOCALE" }).toArray()) as Array<IOrganisationMissionLocale>;

  for (const ml of mls) {
    await createOrUpdateMissionLocaleStats(ml._id);
  }
};
