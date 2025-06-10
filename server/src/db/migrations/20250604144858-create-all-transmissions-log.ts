import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "hydrate:transmissions-all",
    queued: true,
  });
};
