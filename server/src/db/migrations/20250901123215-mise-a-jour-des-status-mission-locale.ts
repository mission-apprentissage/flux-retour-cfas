import { addJob } from "job-processor";

export const up = async () => {
  addJob({
    name: "hydrate:mission-locale-effectif-statut",
    queued: true,
  });
};
