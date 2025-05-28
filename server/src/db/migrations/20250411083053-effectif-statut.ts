import { addJob } from "job-processor";

export const up = async () => {
  addJob({
    name: "hydrate:effectifs:update_all_computed_statut",
    queued: true,
  });
};
