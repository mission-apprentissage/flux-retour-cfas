import logger from "../../../common/logger.js";
import { effectifsDb, organismesDb } from "../../../common/model/collections.js";

/**
 * Fonction "patch" de correction d'une mauvaise transmission d'organisme
 * On déplace les effectifs de l'organisme à conserver vers celui à supprimer, puis on le supprime de la base
 */
export const patchBadTransmissionOrganisme = async ({ uai_toKeep, siret_toKeep, uai_toRemove, siret_toRemove }) => {
  logger.info("Patch de mauvaise transmission...");

  const cleanOrganisme = await organismesDb().findOne({ uai: uai_toKeep, siret: siret_toKeep });
  const toRemoveOrganisme = await organismesDb().findOne({ uai: uai_toRemove, siret: siret_toRemove });

  if (cleanOrganisme && toRemoveOrganisme) {
    logger.info(
      `Déplacement des effectifs de l'organisme à supprimer (uai ${uai_toRemove} - siret ${siret_toRemove}) vers l'organisme à conserver (uai ${uai_toKeep} - siret ${siret_toKeep})`
    );
    await effectifsDb().updateMany(
      { organisme_id: toRemoveOrganisme._id },
      { $set: { organisme_id: cleanOrganisme._id } }
    );
    logger.info("Effectifs déplacés vers l'organisme à conserver");

    await organismesDb().deleteOne({ uai: uai_toRemove, siret: siret_toRemove });
    logger.info("Organisme à supprimer supprimé");
  }
};
