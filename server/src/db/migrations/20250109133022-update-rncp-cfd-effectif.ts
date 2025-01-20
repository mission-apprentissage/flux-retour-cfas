import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:formation-certification",
    queued: true,
  });
};
