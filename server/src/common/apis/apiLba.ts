import logger from "@/common/logger";
import config from "@/config";

import getApiClient from "./client";

// Cf Documentation : https://labonnealternance.pole-emploi.fr/api-docs/

const NO_METIERS_FOUND_ERROR_MSG = "No training found";

const axiosClient = getApiClient({
  baseURL: config.lbaApi.endpoint,
});

/**
 * Renvoie une liste de métiers depuis l'API LBA pour un siret donné
 * @param  string siret
 * @returns
 */
export const getMetiersBySiret = async (siret: string) => {
  if (!siret) throw new Error("sirets param must be a specified");

  try {
    const { data } = await axiosClient.get(`/v1/metiers/metiersParEtablissement/${encodeURIComponent(siret)}`);
    return data?.metiers ?? [];
  } catch (err: any) {
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
