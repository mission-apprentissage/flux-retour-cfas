import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:organisation-organisme",
    queued: true,
  });
};
