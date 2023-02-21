import { FIABILISATION_MAPPINGS } from "../../../jobs/fiabilisation/uai-siret/mapping.js";
import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../constants/fiabilisationConstants.js";
import { fiabilisationUaiSiretDb } from "../../model/collections.js";

/**
 * Renvoi le couple UAI-SIRET fiabilisé si présent dans le fichier de fiabilisation
 * @param {Object} options
 * @param {string} options.uai
 * @param {string|null} options.siret
 *
 * @returns
 */
export const mapFiabilizedOrganismeUaiSiretCouple = async ({ uai, siret = null }) => {
  // Construction d'un tableau de mapping à partir de la collection et du tableau mapping
  const fiabilisationUaiSiretFromCollection = await fiabilisationUaiSiretDb()
    .find({ type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER })
    .toArray();
  const fiabilisationMappings = [...fiabilisationUaiSiretFromCollection, ...FIABILISATION_MAPPINGS];

  const foundCouple = fiabilisationMappings
    .filter((item) => item.uai === uai && item.siret === siret)
    .map(({ uai_fiable, siret_fiable }) => ({ cleanUai: uai_fiable, cleanSiret: siret_fiable }));

  return foundCouple[0] || { cleanUai: uai, cleanSiret: siret }; // Take only first match
};
