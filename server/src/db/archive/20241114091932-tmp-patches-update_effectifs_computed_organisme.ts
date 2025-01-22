import { addJob } from "job-processor";

export const up = async () => {
  await addJob({ name: "tmp:patches:update_effectifs_computed_organisme", queued: true });
};
