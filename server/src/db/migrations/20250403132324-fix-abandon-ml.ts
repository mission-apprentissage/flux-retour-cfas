import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:mission-locale-snapshot-update",
    queued: true,
  });
};
