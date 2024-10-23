import axiosRetry from "axios-retry";
import ApiDeca, { Contrat } from "shared/models/apis/@types/ApiDeca";

import logger from "@/common/logger";
import { ApiError, apiRateLimiter } from "@/common/utils/apiUtils";
import config from "@/config";

import getApiClient from "./client";

const API_ENDPOINT = config.decaApi.endpoint;

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
const getContratsDeca = async (dateDebut: string, dateFin: string, page: number): Promise<ApiDeca> => {
  return executeWithRateLimiting(async (client: any) => {
    axiosRetry(client, { retries: 3 });

    try {
      let response = await client.post(
        `contrats/extractTBA`,
        {
          dateDebut,
          dateFin,
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
        `[API Deca] Récupération contrats du ${dateDebut} au ${dateFin} - page ${page} sur ${
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

export const getAllContrats = async (dateDebut: string, dateFin: string): Promise<Contrat[]> => {
  const allContrats: Contrat[] = [];

  // Fetch de la première page
  const apiResponse: ApiDeca = await getContratsDeca(dateDebut, dateFin, 1);
  logger.info(
    `> API DECA - Fetch => [dateDebut : ${dateDebut} - dateFin : ${dateFin} - page : 1] => Métadonnées Réponse : ${JSON.stringify(
      apiResponse?.metadonnees
    )}`
  );
  allContrats.push(...apiResponse.contrats);

  // Fetch sur toutes les pages restantes
  for (let pageIndex = 2; pageIndex <= apiResponse.metadonnees.totalPages; pageIndex++) {
    const apiResponse: ApiDeca = await getContratsDeca(dateDebut, dateFin, pageIndex);
    logger.info(
      `> API DECA - Fetch => [dateDebut : ${dateDebut} - dateFin : ${dateFin} - page : ${pageIndex}] => Métadonnées Réponse : ${JSON.stringify(
        apiResponse?.metadonnees
      )}`
    );
    allContrats.push(...apiResponse.contrats);
  }

  return allContrats;
};
