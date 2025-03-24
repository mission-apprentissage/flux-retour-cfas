import { addJob } from "job-processor";
import { Db } from "mongodb";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

export const up = async (db: Db) => {
  await missionLocaleEffectifsDb().deleteMany();
  await db.collection("missionLocaleEffectifLogs").drop();

  await addJob({
    name: "hydrate:mission-locale-effectif-snapshot",
    queued: true,
  });
};
