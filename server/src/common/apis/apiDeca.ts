import axiosRetry from "axios-retry";
import { format } from "date-fns";

import logger from "@/common/logger";
import { ApiError, apiRateLimiter } from "@/common/utils/apiUtils";
import config from "@/config";

import ApiDeca from "./@types/ApiDeca";
import getApiClient from "./client";

export const API_ENDPOINT = config.decaApi.endpoint;

const axiosClient = getApiClient({
  baseURL: API_ENDPOINT,
});

const executeWithRateLimiting = apiRateLimiter("apiDeca", {
  nbRequests: 2,
  durationInSeconds: 1,
  client: axiosClient,
});

/**
 * Fonction de récupération des contrats DECA depuis l'API mise à disposition par la DGEFP
 * @param dateDebut
 * @param dateFin
 * @param page
 * @returns
 */
export const getContratsDeca = async (dateDebut: Date, dateFin: Date, page: number): Promise<ApiDeca> => {
  return executeWithRateLimiting(async (client: any) => {
    axiosRetry(client, { retries: 3 });

    try {
      let response = await client.get(`contrats/extractTBA`, {
        params: {
          dateDebut: format(dateDebut, "yyyy-MM-dd"),
          dateFin: format(dateFin, "yyyy-MM-dd"),
          page,
        },
      });

      logger.debug(
        `[Deca API] Récupération contrats du ${dateDebut.toLocaleDateString()} au ${dateFin.toLocaleDateString()}, page : ${page} ${
          response.cached ? "(depuis le cache)" : ""
        }`
      );
      if (!response?.data) {
        throw new ApiError("Api Deca", "No data received");
      }
      return response.data;
    } catch (e: any) {
      throw new ApiError("Api Deca getContratsDeca", e.message, e.code || e.response?.status);
    }
  });
};
