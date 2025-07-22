import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:ml-date-rupture",
    queued: true,
  });
};
