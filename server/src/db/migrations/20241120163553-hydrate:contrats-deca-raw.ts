import { addJob } from "job-processor";

import { effectifsDECADb } from "@/common/model/collections";

export const up = async () => {
  await effectifsDECADb().deleteMany({});
  await addJob({ name: "indexes:create", queued: true });
  await addJob({ name: "hydrate:contrats-deca-raw", queued: true });
};
