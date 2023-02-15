import axios from "axios";
import logger from "../logger.js";
import config from "../../config.js";

// Cf Documentation : https://labonnealternance.pole-emploi.fr/api-docs/

const API_ENDPOINT = config.lbaApi.endpoint;

const NO_METIERS_FOUND_ERROR_MSG = "No training found";

const fetchMetiersBySiret = async (siret) => {
  const url = `${API_ENDPOINT}/metiers/metiersParEtablissement/${encodeURIComponent(siret)}`;
  const { data } = await axios.get(url);
  return data;
};

/**
 * Renvoie une liste de métiers depuis l'API LBA pour un siret donné
 * @param  [string] siret
 * @returns {{data: {metiers:[string]|null}}
 */
export const getMetiersBySiret = async (siret) => {
  if (!siret) throw new Error("sirets param must be a specified");

  try {
    const { metiers } = await fetchMetiersBySiret(siret);
    return metiers;
  } catch (err) {
    // 500 with specific message on this route means no métiers were found for those SIRET
    if (err.response?.status === 500 && err.response?.data?.error === NO_METIERS_FOUND_ERROR_MSG) {
      return { data: null };
    } else {
      const errorMessage = err.response?.data || err.code;
      logger.error("API LBA getMetiersBySirets something went wrong:", errorMessage);
      throw new Error(`An error occured while fetching métiers for SIRET ${siret}`);
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
export const getMetiersByCfd = async (cfd) => {
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
      logger.error("API LBA getMetiersByCfd something went wrong:", errorMessage);
      throw new Error(`An error occured while fetching métiers for CFD ${cfd}`);
    }
  }
};
