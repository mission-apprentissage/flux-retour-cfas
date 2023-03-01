import axios from "axios";
import logger from "../../common/logger.js";
import config from "../../config.js";

// Cf Documentation : https://tables-correspondances.apprentissage.beta.gouv.fr/api/v1/docs/

export const API_ENDPOINT = config.tablesCorrespondances.endpoint;

/**
 *
 * @param {string} cfd
 * @returns {Promise<(import("./@types/TabCoCfdInfo.js").default)['result']|null>}
 */
export const getCfdInfo = async (cfd) => {
  const url = `${API_ENDPOINT}/cfd`;
  try {
    const { data } = await axios.post(url, {
      cfd,
    });
    return data.result;
  } catch (/** @type {any}*/ error) {
    logger.error(`getCfdInfo: something went wrong while requesting ${url}`, error.response?.data || error.message);
    return null;
  }
};

/**
 *
 * @param {string} codePostal
 * @returns {Promise<import("./@types/TabCoCodePostalInfo.js").default|null>}
 */
export const getCodePostalInfo = async (codePostal) => {
  const url = `${API_ENDPOINT}/code-postal`;
  try {
    const { data } = await axios.post(url, {
      codePostal,
    });
    return data;
  } catch (/** @type {any}*/ error) {
    logger.error(
      `getCodePostalInfo: something went wrong while requesting ${url}`,
      `${error.message} for code=${codePostal}`,
      error.code || error.response?.status
    );
    return null;
  }
};
