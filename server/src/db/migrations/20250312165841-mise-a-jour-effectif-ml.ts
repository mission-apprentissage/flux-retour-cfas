import { addJob } from "job-processor";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

export const up = async () => {
  await missionLocaleEffectifsDb().deleteMany();

  addJob({
    name: "hydrate:mission-locale-effectif-snapshot",
    queued: true,
  });
};
