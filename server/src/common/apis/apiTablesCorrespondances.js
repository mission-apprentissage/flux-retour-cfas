const axios = require("axios");
const logger = require("../../common/logger");
const config = require("../../../config");

// Cf Documentation : https://tables-correspondances.apprentissage.beta.gouv.fr/api/v1/docs/

const API_ENDPOINT = config.tablesCorrespondances.endpoint;

const getCfdInfo = async (cfd) => {
  const url = `${API_ENDPOINT}/cfd`;
  try {
    const { data } = await axios.post(url, {
      cfd,
    });
    return data.result;
  } catch (error) {
    logger.error(`getCfdInfo: something went wrong while requesting ${url}`, error.response.data);
    return null;
  }
};

module.exports = {
  getCfdInfo,
};
