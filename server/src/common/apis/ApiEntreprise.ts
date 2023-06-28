import axiosRetry from "axios-retry";

import logger from "@/common/logger";
import { ApiError, apiRateLimiter } from "@/common/utils/apiUtils";
import config from "@/config";

import ApiEntEtablissement from "./@types/ApiEntEtablissement";
import getApiClient from "./client";

export const API_ENDPOINT = config.apiEntreprise.endpoint;

const axiosClient = getApiClient({
  baseURL: API_ENDPOINT,
});

// Cf Documentation : https://entreprise.api.gouv.fr/
// Migration V2 - V3 cf: https://entreprise.api.gouv.fr/files/correspondance_champs_v2_etablissements.pdf
const executeWithRateLimiting = apiRateLimiter("apiEntreprise", {
  //2 requests per second
  nbRequests: 2,
  durationInSeconds: 1,
  client: axiosClient,
});

const apiParams = {
  token: config.apiEntreprise.key,
  context: config.apiEntreprise.context,
  recipient: config.apiEntreprise.defaultRecipient,
  object: config.apiEntreprise.object,
};

/**
 * Cf swagger : https://entreprise.api.gouv.fr/developpeurs/openapi#tag/Informations-generales/paths/~1v3~1insee~1sirene~1etablissements~1%7Bsiret%7D/get
 * @param {string} siret
 * @returns
 */
export const getEtablissement = async (siret: string): Promise<ApiEntEtablissement> => {
  return executeWithRateLimiting(async (client) => {
    axiosRetry(client, { retries: 3 });

    try {
      let response = await client.get(`insee/sirene/etablissements/${siret}`, {
        params: { ...apiParams },
      });
      logger.debug(`[Entreprise API] Fetched etablissement ${siret} ${response.cached ? "(from cache)" : ""}`);
      if (!response?.data) {
        throw new ApiError("Api Entreprise", "No etablissement data received");
      }
      return response.data;
    } catch (e: any) {
      throw new ApiError("Api Entreprise getEtablissement", e.message, e.code || e.response?.status);
    }
  });
};

/**
 * TODO REMOVE
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
      logger.debug(`[Entreprise API] Fetched convention collective ${siret} ${response.cached ? "(from cache)" : ""}`);

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
