import { addJob } from "job-processor";

export const up = async () => {
  await addJob({ name: "tmp:effectifs:update_computed_statut", queued: true });
};
