const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://catalogue.apprentissage.beta.gouv.fr/api/v1/docs

const API_ENDPOINT = config.mnaCatalogApi.endpoint;

const getFormations2021Count = async () => {
  const url = `${API_ENDPOINT}/entity/formations2021/count`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    logger.error(`getFormations2021Count: something went wrong while requesting ${url}`, err);
    return null;
  }
};

const getFormations2021 = async (options) => {
  const url = `${API_ENDPOINT}/entity/formations2021`;
  try {
    let { page, allFormations, limit, query, select } = { page: 1, allFormations: [], limit: 1050, ...options };

    let params = { page, limit, query, select };
    logger.debug(`Requesting ${url}`, params);
    const response = await axios.get(url, { params });

    const { formations, pagination } = response.data;
    allFormations = allFormations.concat(formations); // Should be properly exploded, function should be pure

    if (page < pagination.nombre_de_page) {
      return getFormations2021({ page: page + 1, allFormations, limit });
    } else {
      return allFormations;
    }
  } catch (err) {
    logger.error(`getFormations2021: something went wrong while requesting ${url}`, err);
    return null;
  }
};

module.exports = {
  getFormations2021Count,
  getFormations2021,
};
