import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "hydrate:mission-locale-stats",
    queued: true,
  });
};
