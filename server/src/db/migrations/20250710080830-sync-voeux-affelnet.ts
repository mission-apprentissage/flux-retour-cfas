import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "hydrate:voeux-academie-code",
    queued: true,
  });
};
