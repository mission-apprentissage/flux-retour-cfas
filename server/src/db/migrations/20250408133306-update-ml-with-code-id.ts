import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:mission-locale-id-code-update",
    queued: true,
  });
};
