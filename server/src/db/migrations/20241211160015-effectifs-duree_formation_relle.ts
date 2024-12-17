import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:effectifs:duree_formation_relle",
    queued: true,
  });
};
