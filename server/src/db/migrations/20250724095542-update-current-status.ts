import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migrate:mission-locale-current-status",
    queued: true,
  });
};
