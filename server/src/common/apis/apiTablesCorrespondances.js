import axios from "axios";
import logger from "../../common/logger.js";
import config from "../../config.js";

// Cf Documentation : https://tables-correspondances.apprentissage.beta.gouv.fr/api/v1/docs/

const API_ENDPOINT = config.tablesCorrespondances.endpoint;

export const getCfdInfo = async (cfd) => {
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

export const getRncpInfo = async (rncp) => {
  const url = `${API_ENDPOINT}/rncp`;
  try {
    const { data } = await axios.post(url, {
      rncp,
    });
    return data.result;
  } catch (error) {
    logger.error(
      `getRncpInfo: something went wrong while requesting ${url}`,
      `${error.message} for rncp=${rncp}`,
      error.code || error.response.status
    );
    return null;
  }
};

export const getCpInfo = async (codePostal) => {
  const url = `${API_ENDPOINT}/code-postal`;
  try {
    const { data } = await axios.post(url, {
      codePostal,
    });
    return data;
  } catch (error) {
    logger.error(
      `getCpInfo: something went wrong while requesting ${url}`,
      `${error.message} for code=${codePostal}`,
      error.code || error.response.status
    );
    return {
      result: {},
      messages: { error: "Erreur techinque" },
    };
  }
};
