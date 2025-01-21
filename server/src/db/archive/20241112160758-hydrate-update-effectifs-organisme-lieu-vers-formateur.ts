import { addJob } from "job-processor";

export const up = async () => {
  await addJob({ name: "hydrate:update-effectifs-organisme-lieu-vers-formateur", queued: true });
};
