const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://labonnealternance.pole-emploi.fr/api-docs/

const API_ENDPOINT = config.lbaApi.endpoint;

const getMetiersBySiret = async (siret) => {
  try {
    const { data } = await axios.get(`${API_ENDPOINT}/metiers/metiersParEtablissement/${siret}`);
    return data;
  } catch (error) {
    logger.error(`getMetiersBySiret: ${siret} - something went wrong`);
    logger.error(error);
    return null;
  }
};

const getMetiersBySirets = async (sirets) => {
  try {
    const { data } = await axios.get(
      `${API_ENDPOINT}/metiers/metiersParEtablissement/${encodeURIComponent(sirets.join(", "))}`
    );
    return data;
  } catch (error) {
    logger.error(`getMetiersBySirets: ${sirets} - something went wrong`);
    logger.error(error);
    return null;
  }
};

const getMetiersByCfd = async (cfd) => {
  try {
    const { data } = await axios.get(`${API_ENDPOINT}/metiers/metiersParFormation/${cfd}`);
    return data;
  } catch (error) {
    logger.error(`getMetiersByCfd: ${cfd} - something went wrong`);
    return null;
  }
};

module.exports = {
  getMetiersBySiret,
  getMetiersBySirets,
  getMetiersByCfd,
};
