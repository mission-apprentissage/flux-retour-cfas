import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "hydrate:effectifs:update_all_computed_statut",
    queued: true,
  });
};
