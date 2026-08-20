import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migrate:statuts-then-ml-current-status",
    queued: true,
  });
};
