import Logger from "bunyan";

import { findOrganismeByUaiAndSiret } from "@/common/actions/organismes/organismes.actions";
import { effectifsDb, organismesDb } from "@/common/model/collections";

/**
 * Fonction "patch" de suppression d'un organisme via son uai et son siret
 * Suppression des effectifs liés s'ils existent
 */
export const removeOrganismeAndEffectifs = async (logger: Logger, { uai, siret }) => {
  logger.info(`Suppression de l'organisme d'uai ${uai} et siret ${siret} ...`);

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
