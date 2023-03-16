import axios from "axios";
import logger from "../logger.js";
import config from "../../config.js";

// Cf Documentation : https://labonnealternance.pole-emploi.fr/api-docs/

const API_ENDPOINT = config.lbaApi.endpoint;

const NO_METIERS_FOUND_ERROR_MSG = "No training found";

/**
 * Renvoie une liste de métiers depuis l'API LBA pour un siret donné
 * @param  string siret
 * @returns {Promise<string[]>}
 */
const fetchMetiersBySiret = async (siret) => {
  const url = `${API_ENDPOINT}/metiers/metiersParEtablissement/${encodeURIComponent(siret)}`;
  const { data } = await axios.get(url);
  return data?.metiers ?? [];
};

/**
 * Renvoie une liste de métiers depuis l'API LBA pour un siret donné
 * @param  string siret
 * @returns
 */
export const getMetiersBySiret = async (siret) => {
  if (!siret) throw new Error("sirets param must be a specified");

  try {
    const metiers = await fetchMetiersBySiret(siret);
    return metiers;
  } catch (/** @type {any}*/ err) {
    // 500 with specific message on this route means no métiers were found for those SIRET
    if (err.response?.status === 500 && err.response?.data?.error === NO_METIERS_FOUND_ERROR_MSG) {
      return [];
    } else {
      const errorMessage = err.response?.data || err.code;
      logger.error("API LBA getMetiersBySirets something went wrong:", errorMessage);
      throw new Error(`An error occured while fetching métiers for SIRET ${siret}`);
    }
  }
};
