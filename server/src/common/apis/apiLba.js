const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://labonnealternance.pole-emploi.fr/api-docs/

const API_ENDPOINT = config.lbaApi.endpoint;

const NO_METIERS_FOUND_ERROR_MSG = "No training found";

const fetchMetiersBySirets = async (sirets) => {
  const url = `${API_ENDPOINT}/metiers/metiersParEtablissement/${encodeURIComponent(sirets.join(", "))}`;
  const { data } = await axios.get(url);
  return data;
};

/**
 * Returns a list of metiers fetched from La Bonne Alternance API based on passed list of SIRET
 * @param  {[string]} sirets
 * @returns {{data: {metiers:[string]|null}}
 */
const getMetiersBySirets = async (sirets) => {
  if (!Array.isArray(sirets) || sirets.length === 0) throw new Error("sirets param must be a non-empty array");

  try {
    const result = await fetchMetiersBySirets(sirets);
    return { data: result };
  } catch (err) {
    // 500 with specific message on this route means no métiers were found for those SIRET
    if (err.response?.status === 500 && err.response?.data?.error === NO_METIERS_FOUND_ERROR_MSG) {
      return { data: null };
    } else {
      const errorMessage = err.response?.data || err.code;
      logger.error(`API LBA getMetiersBySirets something went wrong:`, errorMessage);
      throw new Error(`An error occured while fetching métiers for list of SIRET`, sirets.join(","));
    }
  }
};

const fetchMetiersByCfd = async (cfd) => {
  const url = `${API_ENDPOINT}/metiers/metiersParFormation/${cfd}`;
  const { data } = await axios.get(url);
  return data;
};

/**
 * Returns a list of metiers fetched from La Bonne Alternance API based on passed CFD
 * @param  {string} cfd
 * @returns {{data: {metiers:[string]}|null}}
 */
const getMetiersByCfd = async (cfd) => {
  if (!cfd) throw new Error("cfd param not provided");

  try {
    const result = await fetchMetiersByCfd(cfd);
    return { data: result };
  } catch (err) {
    // 500 with specific message on this route means no métiers were found for this CFD
    if (err.response?.status === 500 && err.response?.data?.error === NO_METIERS_FOUND_ERROR_MSG) {
      return { data: null };
    } else {
      const errorMessage = err.response?.data || err.code;
      logger.error(`API LBA getMetiersByCfd something went wrong:`, errorMessage);
      throw new Error(`An error occured while fetching métiers for CFD ${cfd}`);
    }
  }
};

module.exports = {
  getMetiersBySirets,
  getMetiersByCfd,
};
