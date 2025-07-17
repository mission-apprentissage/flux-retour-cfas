import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:organisation-organismes",
    queued: true,
  });
};
