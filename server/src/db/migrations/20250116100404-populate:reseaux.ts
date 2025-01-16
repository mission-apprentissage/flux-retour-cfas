import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "populate:reseaux",
    queued: true,
  });
};
