import { addJob } from "job-processor";

export const up = async () => {
  await addJob({
    name: "tmp:migration:update-effectif-computed-statut",
    queued: true,
  });
};
