import logger from "../../common/logger.js";
import config from "../../config.js";
import getApiClient from "./client.js";

// Cf Documentation : https://tables-correspondances.apprentissage.beta.gouv.fr/api/v1/docs/

export const API_ENDPOINT = config.tablesCorrespondances.endpoint;

const client = getApiClient({ baseURL: API_ENDPOINT });

/**
 *
 * @param {string} cfd
 * @returns {Promise<(import("./@types/TabCoCfdInfo.js").default)['result']|null>}
 */
export const getCfdInfo = async (cfd) => {
  try {
    const { data } = await client.post("/cfd", { cfd });
    return data.result;
  } catch (error: any) {
    logger.error(
      `getCfdInfo: something went wrong while requesting CFD "${cfd}"`,
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 *
 * @param {string} codePostal
 * @returns {Promise<import("./@types/TabCoCodePostalInfo.js").default|null>}
 */
export const getCodePostalInfo = async (codePostal) => {
  try {
    const { data } = await client.post("/code-postal", { codePostal });
    return data;
  } catch (error: any) {
    logger.error(
      `getCodePostalInfo: something went wrong while requesting code postal "${codePostal}": ${error.message}`,
      error.code || error.response?.status
    );
    return null;
  }
};
