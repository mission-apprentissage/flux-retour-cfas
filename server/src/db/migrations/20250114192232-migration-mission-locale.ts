import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:hydrate-mission-locale",
    queued: true,
  });
};
