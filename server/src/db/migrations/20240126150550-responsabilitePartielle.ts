import { addJob } from "job-processor";

export const up = async () => {
  // # Remplissage des organismes issus du référentiel
  await addJob({ name: "hydrate:organismes-referentiel", queued: true });
  // # Remplissage des formations issus du catalogue
  await addJob({ name: "hydrate:formations-catalogue", queued: true });
  // # Remplissage des organismes depuis le référentiel
  await addJob({ name: "hydrate:organismes", queued: true });
  // # Mise à jour des relations
  await addJob({ name: "hydrate:organismes-relations", queued: true });
};
