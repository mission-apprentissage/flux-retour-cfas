import { addJob } from "job-processor";

export const up = async () => {
  // Make sur indexes will be created before starting the migration
  await addJob({
    name: "indexes:create",
    queued: true,
  });
  await addJob({
    name: "hydrate:mission-locale-organisation",
    queued: true,
  });
};
