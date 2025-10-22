import { addJob } from "job-processor";

export const up = async () => {
  return addJob({
    name: "tmp:hydrate:inscrit-sans-contrat",
  });
};
