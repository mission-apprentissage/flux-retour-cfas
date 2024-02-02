import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:patches:update-firstTransmissionDate-organismes",
    payload: null,
    queued: true,
  });
};
