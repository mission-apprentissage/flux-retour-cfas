import { STATUT_PRESENCE_REFERENTIEL } from "@/common/constants/organisme";
import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

/**
 * Fonction "patch" de suppression des organismes n'ayant jamais transmis et n'étant pas présents dans le référentiel
 */
export const removeOrganismesAbsentsReferentielSansTransmission = async () => {
  logger.info("Suppression des organismes absents du référentiel et n'ayant jamais transmis ... ");

  const { deletedCount } = await organismesDb().deleteMany({
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
    $or: [{ first_transmission_date: { $exists: false } }, { first_transmission_date: undefined }],
  });

  logger.info(`${deletedCount} organismes supprimés avec succès !`);
};
