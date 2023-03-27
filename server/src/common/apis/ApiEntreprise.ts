import axiosRetry from "axios-retry";

import config from "../../config.js";
import logger from "../logger.js";
import { ApiError, apiRateLimiter } from "../utils/apiUtils.js";
import getApiClient from "./client.js";

export const API_ENDPOINT = config.apiEntreprise.endpoint;

const axiosClient = getApiClient({
  baseURL: API_ENDPOINT,
});

// Cf Documentation : https://v2.entreprise.api.gouv.fr/catalogue/
const executeWithRateLimiting = apiRateLimiter("apiEntreprise", {
  //2 requests per second
  nbRequests: 2,
  durationInSeconds: 1,
  client: axiosClient,
});

const apiParams = {
  token: config.apiEntreprise.key,
  context: "MNA",
  recipient: "13002526500013", // Siret Dinum
  object: "Consolidation des données",
  non_diffusables: true,
};

/**
 * getEntreprise
 * @param {string} siren
 * @param {boolean} non_diffusables
 * @returns {Promise<import("./@types/ApiEntEntreprise").default|null>}
 */
export const getEntreprise = (siren, non_diffusables = true) => {
  return executeWithRateLimiting(async (client) => {
    try {
      let response = await client.get(`entreprises/${siren}`, {
        params: { ...apiParams, non_diffusables },
      });
      logger.debug(`[Entreprise API] Fetching entreprise ${siren} ${response.cached ? "(from cache)" : ""}`);
      if (!response?.data?.entreprise) {
        throw new ApiError("Api Entreprise", "No entreprise data received");
      }
      return response.data.entreprise;
    } catch (e: any) {
      if (e.message.includes("timeout")) {
        return null;
      }
      if (e.response?.status === 404) {
        return null;
      }
      throw new ApiError("Api Entreprise getEntreprise", e.message, e.code || e.response?.status);
    }
  });
};

/**
 * getEtablissement
 * @param {string} siret
 * @param {boolean} non_diffusables
 * @returns {Promise<import("./@types/ApiEntEtablissement").default>}
 */
export const getEtablissement = async (siret, non_diffusables = true) => {
  return executeWithRateLimiting(async (client) => {
    axiosRetry(client, { retries: 3 });

    try {
      let response = await client.get(`etablissements/${siret}`, {
        params: { ...apiParams, non_diffusables },
      });
      logger.debug(`[Entreprise API] Fetching etablissement ${siret} ${response.cached ? "(from cache)" : ""}`);
      if (!response?.data?.etablissement) {
        throw new ApiError("Api Entreprise", "No etablissement data received");
      }
      return response.data.etablissement;
    } catch (e: any) {
      throw new ApiError("Api Entreprise getEtablissement", e.message, e.code || e.response?.status);
    }
  });
};

/**
 *
 * Exemple: https://entreprise.api.gouv.fr/v2/conventions_collectives/82161143100015
 * @param {string} siret
 * @param {boolean} non_diffusables
 * @returns {Promise<import("./@types/ApiEntConventionCollective").default|null>}
 */
export const getConventionCollective = async (siret, non_diffusables = true) => {
  return executeWithRateLimiting(async (client) => {
    try {
      let response = await client.get(`conventions_collectives/${siret}`, {
        params: { ...apiParams, non_diffusables },
      });
      logger.debug(`[Entreprise API] Fetching convention collective ${siret} ${response.cached ? "(from cache)" : ""}`);

      if (!response?.data?.conventions[0]) {
        throw new ApiError("Api Entreprise", "error getConventionCollective");
      }
      return response.data.conventions[0];
    } catch (e: any) {
      if (e.response?.status === 404) {
        return null;
      } else {
        throw new ApiError("Api Entreprise ConventionCollective", e.message, e.code || e.response?.status);
      }
    }
  });
};
