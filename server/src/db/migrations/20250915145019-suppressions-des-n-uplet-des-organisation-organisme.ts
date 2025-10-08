import { addJob } from "job-processor";

// Suppression des organisations de type ORGANISME_FORMATION n'ayant aucun utilisateur rattaché
export const up = async () => {
  await addJob({
    name: "tmp:migration:dedoublon-organisation",
    queued: true,
  });
};
