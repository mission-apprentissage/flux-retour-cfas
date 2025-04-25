import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:mission-locale-adresse-update",
    queued: true,
  });
};
