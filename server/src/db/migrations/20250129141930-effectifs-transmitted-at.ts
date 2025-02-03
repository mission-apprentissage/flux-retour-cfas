import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:effectifs-transmitted-at",
    queued: true,
  });
};
