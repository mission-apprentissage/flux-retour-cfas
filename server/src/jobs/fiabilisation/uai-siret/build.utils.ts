import { STATUT_FIABILISATION_ORGANISME } from "shared";

import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

/**
 * Reset du flag statut de fiabilisation pour tous les organismes
 */
export const resetOrganismesFiabilisationStatut = async () => {
  logger.info("Remise à 0 des organismes comme ayant une fiabilisation inconnue...");
  await organismesDb().updateMany({}, { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU } });
};
