import axios from "axios";
import parentLogger from "../logger.js";
import config from "../../config.js";

// Cf Documentation : https://catalogue.apprentissage.beta.gouv.fr/api/v1/docs

const logger = parentLogger.child({
  module: "api-catalogue",
});

/**
 * Méthode de récupération depuis l'API Catalogue des formations liées à un UAI d'organisme
 * @param {string} uai
 * @param {number} [page=1]
 * @returns {Promise<import("./@types/CatalogueFormation").default[]>}
 */
export const getCatalogFormationsForOrganisme = async (uai, page = 1) => {
  try {
    // On cherche parmi les formations publiées ayant soit l'UAI formateur soit l'UAI gestionnaire
    const response = await axios.get(`${config.mnaCatalogApi.endpoint}/entity/formations`, {
      params: {
        page,
        limit: 1050,
        query: {
          published: true,
          catalogue_published: true,
          $or: [{ etablissement_formateur_uai: uai }, { etablissement_gestionnaire_uai: uai }],
        },
      },
    });

    const { formations, pagination } = response.data;

    if (page < pagination.nombre_de_page) {
      formations.push(...(await getCatalogFormationsForOrganisme(uai, page + 1)));
    } else {
      // only log on page 1
      logger.debug({ uai, nbFormations: pagination.total }, "getCatalogFormationsForOrganisme");
    }
    return formations;
  } catch (/** @type {any}*/ err: any) {
    logger.error("getFormationsForOrganisme error", err.response?.data || err.message);
    return [];
  }
};
