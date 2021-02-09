const axios = require("axios");
const logger = require("../../common/logger");
const config = require("../../../config");

// Cf Documentation : https://tables-correspondances.apprentissage.beta.gouv.fr/api/v1/docs/

const API_ENDPOINT = config.tablesCorrespondances.endpoint;

const getCfdInfo = async (cfd) => {
  try {
    const { data } = await axios.post(`${API_ENDPOINT}/cfd`, {
      cfd,
    });
    return data.result;
  } catch (error) {
    logger.error(`getCfdInfo: something went wrong`);
    return null;
  }
};

const getSiretInfo = async (siret) => {
  try {
    const { data } = await axios.post(`${API_ENDPOINT}/siret`, {
      siret,
    });
    return data.result;
  } catch (error) {
    logger.error(`getSiretInfo: something went wrong`);
    return null;
  }
};

const getRncpInfo = async (rncp) => {
  try {
    const { data } = await axios.post(`${API_ENDPOINT}/rncp`, {
      rncp,
    });
    return data.result;
  } catch (error) {
    logger.error(`getRncpInfo: something went wrong`);
    return null;
  }
};

const getEtablissementByUai = async (uai) => {
  try {
    const query = JSON.stringify({ uai });
    const { data } = await axios.get(
      `${API_ENDPOINT}/entity/etablissements/siret-uai?query=${encodeURIComponent(query)}`
    );
    return data;
  } catch (error) {
    logger.error(`getEtablissementByUai: something went wrong`);
    return null;
  }
};

const getEtablissementBySiret = async (siret) => {
  try {
    const query = JSON.stringify({ siret });
    const { data } = await axios.get(
      `${API_ENDPOINT}/entity/etablissements/siret-uai?query=${encodeURIComponent(query)}`
    );
    return data;
  } catch (error) {
    logger.error(`getEtablissementBySiret: something went wrong`);
    return null;
  }
};

module.exports = {
  getCfdInfo,
  getSiretInfo,
  getRncpInfo,
  getEtablissementByUai,
  getEtablissementBySiret,
};
