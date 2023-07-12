import axiosRetry from "axios-retry";
import { format } from "date-fns";

import logger from "@/common/logger";
import { ApiError, apiRateLimiter } from "@/common/utils/apiUtils";
import config from "@/config";

import ApiDeca, { Contrat } from "./@types/ApiDeca";
import getApiClient from "./client";

export const API_ENDPOINT = config.decaApi.endpoint;

const axiosClient = getApiClient({
  baseURL: API_ENDPOINT,
  timeout: 600000, // Nécessaire pour Deca car très long - en attente optimisation de leur coté
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
      let response = await client.post(
        `contrats/extractTBA`,
        {
          dateDebut: format(dateDebut, "yyyy-MM-dd"),
          dateFin: format(dateFin, "yyyy-MM-dd"),
          page,
        },
        {
          auth: {
            username: config.decaApi.login,
            password: config.decaApi.password,
          },
        }
      );

      logger.debug(
        `[API Deca] Récupération contrats du ${dateDebut.toLocaleDateString()} au ${dateFin.toLocaleDateString()} - page ${page} sur ${
          response?.data?.metadonnees?.totalPages
        } ${response.cached ? "(depuis le cache)" : ""}`
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

export const getAllContrats = async (dateDebut: Date, dateFin: Date): Promise<Contrat[]> => {
  const allContrats: Contrat[] = [];

  // Fetch de la première page
  const apiResponse: ApiDeca = await getContratsDeca(dateDebut, dateFin, 1);
  allContrats.push(...apiResponse.contrats);

  // Fetch sur toutes les pages restantes
  for (let pageIndex = 2; pageIndex <= apiResponse.metadonnees.totalPages; pageIndex++) {
    const apiResponse: ApiDeca = await getContratsDeca(dateDebut, dateFin, pageIndex);
    allContrats.push(...apiResponse.contrats);
  }

  return allContrats;
};
