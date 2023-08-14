import logger from "@/common/logger";
import { OrganismesReferentiel } from "@/common/model/@types";
import { organismesReferentielDb } from "@/common/model/collections";

/**
 * Fonction de vérification d'un couple UAI-SIRET correspondant à un organisme fiable
 */
export const isOrganismeFiableForCouple = async (
  uai: string | undefined,
  siret: string | undefined,
  organismesFromReferentiel: OrganismesReferentiel[] = []
) => {
  try {
    // Si la liste des of du référentiel fournie est vide on refresh les données depuis la base
    if (organismesFromReferentiel.length === 0) {
      organismesFromReferentiel = await organismesReferentielDb().find().toArray();
    }

    // Si uai ou siret non fourni alors non fiable
    if (!uai || !siret) return false;

    // Si on trouve un organisme ouvert dans le référentiel avec ce couple uai / siret alors il est fiable
    return (await organismesReferentielDb().countDocuments({ siret, uai, etat_administratif: { $ne: "fermé" } })) > 0;
  } catch (err) {
    logger.warn({ uai, siret }, "organisme non trouvé pour ce couple");
    return false;
  }
};
