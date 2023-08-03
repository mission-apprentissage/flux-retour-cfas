import logger from "@/common/logger";
import config from "@/config";

import TabCoCfdInfo from "./@types/TabCoCfdInfo";
import TabCoCodePostalInfo from "./@types/TabCoCodePostalInfo";
import getApiClient from "./client";

// Cf Documentation : https://tables-correspondances.apprentissage.beta.gouv.fr/api/v1/docs/

export const API_ENDPOINT = config.tablesCorrespondances.endpoint;

const client = getApiClient({ baseURL: API_ENDPOINT });

/**
 *
 * @param {string} cfd
 * @returns {Promise<(import("./@types/TabCoCfdInfo.js").default)['result']|null>}
 */
export const getCfdInfo = async (cfd: string): Promise<TabCoCfdInfo | null> => {
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

export const getCodePostalInfo = async (codePostal: string | null | undefined): Promise<TabCoCodePostalInfo | null> => {
  if (!codePostal) return null;
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
