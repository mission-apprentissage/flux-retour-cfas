import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";
import { FIABILISATION_TYPES } from "../../../../common/constants/fiabilisationConstants.js";
import logger from "../../../../common/logger.js";
import { fiabilisationUaiSiretDb, organismesDb } from "../../../../common/model/collections.js";

const JOB_NAME = "fiabilisation-update-fiabilisation-type-aFiabiliser";

/**
 * Script de MAJ des entrées dans la collection fiabilisationUaiSiret avec un type = A_FIABILISER
 * Script de MAJ des organismes avec statut de fiabilisation a inconnue
 * Script temporaire nécessaire pour mettre à jour la collection aprés avoir ajouté le champ type qui doit coller à l'enum FIABILISATION_TYPES
 */
export const updateFiabilisationUaiSiretAFiabiliser = async () => {
  // MaJ de toutes les entrées de fiabilisation en a fiabiliser par défaut
  await fiabilisationUaiSiretDb().updateMany({}, { $set: { type: FIABILISATION_TYPES.A_FIABILISER } });
  logger.info(`MAJ des fiabilisationUaiSiret en type = ${FIABILISATION_TYPES.A_FIABILISER} réalisée avec succès !`);

  // MaJ de tous les organismes - fiabilisation inconnue par défaut
  await organismesDb().updateMany({}, { $set: { fiabilisation_statut: FIABILISATION_TYPES.INCONNUE } });
  logger.info(`MAJ des organismes avec fiabilisation INCONNUE par défault réalisée avec succès !`);

  await createJobEvent({
    jobname: JOB_NAME,
    date: new Date(),
    action: "finishing",
  });
};
