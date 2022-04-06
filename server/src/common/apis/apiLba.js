const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://labonnealternance.pole-emploi.fr/api-docs/

const API_ENDPOINT = config.lbaApi.endpoint;
const API_DELAY_QUOTA = 100;

const getMetiersBySiret = async (siret) => {
  const url = `${API_ENDPOINT}/metiers/metiersParEtablissement/${siret}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    logger.error(`getMetiersBySiret: something went wrong while requesting ${url}`, err.response.data);
    return null;
  }
};

const getMetiersBySirets = async (sirets) => {
  const url = `${API_ENDPOINT}/metiers/metiersParEtablissement/${encodeURIComponent(sirets.join(", "))}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    logger.error(`getMetiersBySirets: something went wrong while requesting ${url}`, err.response.data);
    return null;
  }
};

const getMetiersByCfd = async (cfd) => {
  const url = `${API_ENDPOINT}/metiers/metiersParFormation/${cfd}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    logger.error(`getMetiersByCfd: something went wrong while requesting ${url}`, err.response.data);
    return null;
  }
};

module.exports = {
  getMetiersBySiret,
  getMetiersBySirets,
  getMetiersByCfd,
  API_DELAY_QUOTA,
};
