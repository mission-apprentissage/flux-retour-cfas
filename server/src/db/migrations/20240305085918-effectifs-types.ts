import { addJob } from "job-processor";

export const up = async () => {
  await addJob({ name: "hydrate:effectifs-computed-types", queued: true });
};
