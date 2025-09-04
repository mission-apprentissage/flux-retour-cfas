import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:ml-activation-date",
    queued: true,
  });
};
