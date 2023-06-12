import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "@/common/constants/fiabilisation";
import logger from "@/common/logger";
import { OrganismesReferentiel } from "@/common/model/@types";
import { fiabilisationUaiSiretDb, organismesReferentielDb } from "@/common/model/collections";

/**
 * Renvoi le couple UAI-SIRET fiabilisé si présent dans le fichier de fiabilisation
 * @param {Object} options
 * @param {string} options.uai
 * @param {string|null} options.siret
 *
 * @returns
 */
export const mapFiabilizedOrganismeUaiSiretCouple = async ({ uai, siret = null }: any) => {
  // Construction d'un tableau de mapping à partir de la collection et du tableau mapping
  const fiabilisationUaiSiretFromCollection = await fiabilisationUaiSiretDb()
    .find({ type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER })
    .toArray();

  const foundCouple = fiabilisationUaiSiretFromCollection
    .filter((item) => item.uai === uai && item.siret === siret)
    .map(({ uai_fiable, siret_fiable }) => ({ cleanUai: uai_fiable, cleanSiret: siret_fiable }));

  return foundCouple[0] || { cleanUai: uai, cleanSiret: siret }; // Take only first match
};

/**
 * Fonction de vérification d'un couple UAI-SIRET correspondant à un organisme fiable
 * @param {Object} options
 * @param {string|null} options.uai
 * @param {string|null} options.siret
 * @param {OrganismesReferentiel[]|[]} options.organismesFromReferentiel
 * @returns
 */
export const isOrganismeFiableForCouple = async (
  uai: string | null,
  siret: string | null,
  organismesFromReferentiel: OrganismesReferentiel[] = []
) => {
  try {
    // Si la liste des of du référentiel fournie est vide on refresh les données depuis la base
    if (organismesFromReferentiel.length === 0) {
      organismesFromReferentiel = await organismesReferentielDb().find().toArray();
    }

    // Si on trouve un organisme ouvert dans le référentiel avec ce couple uai / siret alors il est fiable
    return organismesFromReferentiel.some(
      (item) => item.siret === siret && item.uai === uai && item.etat_administratif !== "fermé"
    )
      ? true
      : false;
  } catch (err) {
    logger.warn({ uai, siret }, "organisme non trouvé pour ce couple");
    return false;
  }
};
