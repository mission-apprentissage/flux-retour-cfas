import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:hydrate:timeseries-stats-ml",
    queued: true,
  });
};
