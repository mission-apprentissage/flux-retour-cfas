import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migrate:ml-suivi-dates",
    queued: true,
  });
};
