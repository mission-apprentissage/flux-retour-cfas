import { findOrganismeByUaiAndSiret } from "../../../common/actions/organismes/organismes.actions.js";
import logger from "../../../common/logger.js";
import { dossiersApprenantsMigrationDb, effectifsDb, organismesDb } from "../../../common/model/collections.js";

/**
 * Fonction "patch" de suppression d'un organisme via son uai et son siret
 * Suppression des dossiersApprenantsMigration liés s'ils existent
 * Suppression des effectifs liés s'ils existent
 */
export const removeOrganismeAndEffectifsAndDossiersApprenantsMigration = async ({ uai, siret }) => {
  logger.info(`Suppression de l'organisme d'uai ${uai} et siret ${siret} ...`);

  // Suppression des dossiersApprenants liés
  const countDossiersApprenantForUaiSiret = await dossiersApprenantsMigrationDb().countDocuments({
    uai_etablissement: uai,
    siret_etablissement: siret,
  });
  logger.info(`${countDossiersApprenantForUaiSiret} dossiersApprenantsMigration liés à supprimer ...`);
  const { deletedCount: deletedDossiersApprenants } = await dossiersApprenantsMigrationDb().deleteMany({
    uai_etablissement: uai,
    siret_etablissement: siret,
  });
  logger.info(`${deletedDossiersApprenants} dossiersApprenantsMigration liés supprimés avec succès !`);

  // Identification de l'organisme et suppression des effectifs liés
  const organismeFound = await findOrganismeByUaiAndSiret(uai, siret);
  if (organismeFound) {
    const countEffectifsForOrganisme = await effectifsDb().countDocuments({ organisme_id: organismeFound?._id });
    logger.info(`${countEffectifsForOrganisme} effectifs liés à supprimer ...`);
    const { deletedCount: deletedEffectifs } = await effectifsDb().deleteMany({ organisme_id: organismeFound?._id });
    logger.info(`${deletedEffectifs} effectifs liés supprimés avec succès !`);
    // Suppression de l'organisme
    await organismesDb().deleteOne({ _id: organismeFound?._id });
    logger.info(`Suppression de l'organisme d'uai ${uai} et siret ${siret} effectuée avec succès !`);
  }
};
