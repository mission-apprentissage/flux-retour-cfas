import axios from "axios";
import logger from "../logger.js";
import config from "../../config.js";

// Cf Documentation : https://catalogue.apprentissage.beta.gouv.fr/api/v1/docs

const API_ENDPOINT = config.mnaCatalogApi.endpoint;

export const getFormations = async (options) => {
  const url = `${API_ENDPOINT}/entity/formations`;
  try {
    let { page, allFormations, limit, query, select } = { page: 1, allFormations: [], limit: 1050, ...options };

    let params = { page, limit, query, select };
    logger.debug(`Requesting ${url}`, params);
    const response = await axios.get(url, { params });

    const { formations, pagination } = response.data;
    allFormations = allFormations.concat(formations); // Should be properly exploded, function should be pure

    if (page < pagination.nombre_de_page) {
      return getFormations({ page: page + 1, allFormations, limit });
    } else {
      return allFormations;
    }
  } catch (err) {
    logger.error(`getFormations: something went wrong while requesting ${url}`, err.response?.data, err.message);
    return null;
  }
};

/**
 * TODO : Optim fetching & pagination récupération
 * Méthode de récupération depuis l'API Catalogue des formations lié à un UAI d'organisme
 * @param {*} uai
 * @param {*} cfd
 * @returns
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

    let { page, allFormations, limit, select } = { page: 1, allFormations: [], limit: 1050 };

    let params = { page, limit, query, select };
    const response = await axios.get(url, { params });

    const { formations, pagination } = response.data;
    allFormations = allFormations.concat(formations); // Should be properly exploded, function should be pure

    if (page < pagination.nombre_de_page) {
      return getCatalogFormationsForOrganisme({ page: page + 1, allFormations, limit });
    } else {
      return allFormations;
    }
  } catch (err) {
    logger.error(
      `getFormationsForOrganisme: something went wrong while requesting ${url}`,
      err.response?.data || err.message
    );
    return null;
  }
};
