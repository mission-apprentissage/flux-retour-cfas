import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "hydrate:daily-mission-locale-stats",
    queued: true,
  });
};
