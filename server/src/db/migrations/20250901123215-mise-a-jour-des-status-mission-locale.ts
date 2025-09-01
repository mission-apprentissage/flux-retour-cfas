import { addJob } from "job-processor";

export const up = async () => {
  addJob({
    name: "mission-locale-effectif-statut",
    queued: true,
  });
};
