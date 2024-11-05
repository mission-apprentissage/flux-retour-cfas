import { addJob } from "job-processor";

export const up = async () => {
  // # Mise a jour lieu de formation d'effectifs
  await addJob({ name: "hydrate:update-effectifs-lieu-de-formation", queued: true });
};
