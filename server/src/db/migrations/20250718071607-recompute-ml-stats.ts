import { missionLocaleStatsDb } from "@/common/model/collections";
import { hydrateMissionLocaleStats } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";

export const up = async () => {
  await missionLocaleStatsDb().deleteMany({});
  await hydrateMissionLocaleStats();
};
