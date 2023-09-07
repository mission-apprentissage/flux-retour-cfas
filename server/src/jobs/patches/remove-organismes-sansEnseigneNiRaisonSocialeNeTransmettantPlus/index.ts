import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

/**
 * Fonction "patch" de suppression des organismes inconnus = sans enseigne ni raison sociale
 * et ne transmettant plus
 */
export const removeOrganismeSansEnseigneNiRaisonSocialeNeTransmettantPlus = async () => {
  logger.info(`Suppression des organismes inconnus = sans enseigne ni raison sociale n'ayant jamais transmis' ...`);

  const { deletedCount } = await organismesDb().deleteMany({
    enseigne: { $exists: false },
    raison_sociale: { $exists: false },
    $or: [{ last_transmission_date: { $exists: false } }, { last_transmission_date: undefined }],
  });

  logger.info(`${deletedCount} organismes supprimés avec succès !`);
};
