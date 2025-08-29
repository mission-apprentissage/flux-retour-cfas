import { addJob } from "job-processor";

export const up = async () => {
  addJob({
    name: "tmp:migration:ml-duplication",
    queued: true,
  });
};
