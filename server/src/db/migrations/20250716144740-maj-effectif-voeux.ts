import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "hydrate:voeux-effectifs-relations",
    queued: true,
  });
};
