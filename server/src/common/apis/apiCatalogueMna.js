const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://catalogue.apprentissage.beta.gouv.fr/api/v1/docs

const API_ENDPOINT = config.mnaCatalogApi.endpoint;

const getFormations = async (options) => {
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
    logger.error(`getFormations: something went wrong while requesting ${url}`, err);
    return null;
  }
};

module.exports = {
  getFormations,
};
