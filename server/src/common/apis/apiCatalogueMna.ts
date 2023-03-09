import axios from "axios";
import logger from "../logger";
import config from "../../config";

// Cf Documentation : https://catalogue.apprentissage.beta.gouv.fr/api/v1/docs

export const API_ENDPOINT = config.mnaCatalogApi.endpoint;

/**
 * TODO : Optim fetching & pagination récupération
 * Méthode de récupération depuis l'API Catalogue des formations lié à un UAI d'organisme
 * @param {string} uai
 * @returns {Promise<import("./@types/CatalogueFormation").default[]|null>}
 */
export const getCatalogFormationsForOrganisme = async (uai) => {
  const url = `${API_ENDPOINT}/entity/formations`;
  try {
    // On cherche parmi les formations publiées ayant soit l'UAI formateur soit l'UAI gestionnaire
    const query = {
      published: true,
      catalogue_published: true,
      $or: [{ etablissement_formateur_uai: uai }, { etablissement_gestionnaire_uai: uai }],
    };

    let { page, allFormations, limit, select } = { page: 1, allFormations: [], limit: 1050, select: undefined };

    let params = { page, limit, query, select };
    const response = await axios.get(url, { params });

    const { formations, pagination } = response.data;
    allFormations = allFormations.concat(formations); // Should be properly exploded, function should be pure

    if (page < pagination.nombre_de_page) {
      // TODO handle pagination
      // return getCatalogFormationsForOrganisme({ page: page + 1, allFormations, limit });
    }
    return allFormations;
  } catch (/** @type {any}*/ err) {
    logger.error(
      `getFormationsForOrganisme: something went wrong while requesting ${url}`,
      err.response?.data || err.message
    );
    return [];
  }
};
