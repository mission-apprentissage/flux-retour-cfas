import axios from "axios";
import axiosRetry from "axios-retry";
import config from "../../config.js";
import logger from "../logger.js";
import { ApiError, apiRateLimiter } from "../utils/apiUtils.js";

// Cf Documentation : https://doc.entreprise.api.gouv.fr/#param-tres-obligatoires
const executeWithRateLimiting = apiRateLimiter("apiEntreprise", {
  //2 requests per second
  nbRequests: 2,
  durationInSeconds: 1,
  client: axios.create({
    baseURL: "https://entreprise.api.gouv.fr/v2",
    // timeout: 5000,
  }),
});

const apiParams = {
  token: config.apiEntreprise,
  context: "MNA",
  recipient: "13002526500013", // Siret Dinum
  object: "Consolidation des données",
  non_diffusables: true,
};

export const getEntreprise = (siren, non_diffusables = true) => {
  return executeWithRateLimiting(async (client) => {
    try {
      logger.debug(`[Entreprise API] Fetching entreprise ${siren}...`);
      let response = await client.get(`entreprises/${siren}`, {
        params: { ...apiParams, non_diffusables },
      });
      if (!response?.data?.entreprise) {
        throw new ApiError("Api Entreprise", "No entreprise data received");
      }
      return response.data.entreprise;
    } catch (e) {
      if (e.message.includes("timeout")) {
        return null;
      }
      if (e.response.status === 404) {
        return null;
      }
      throw new ApiError("Api Entreprise getEntreprise", e.message, e.code || e.response.status);
    }
  });
};

export const getEtablissement = async (siret, non_diffusables = true) => {
  return executeWithRateLimiting(async (client) => {
    axiosRetry(client, { retries: 3 });

    try {
      logger.debug(`[Entreprise API] Fetching etablissement ${siret}...`);
      let response = await client.get(`etablissements/${siret}`, {
        params: { ...apiParams, non_diffusables },
      });
      if (!response?.data?.etablissement) {
        throw new ApiError("Api Entreprise", "No etablissement data received");
      }
      return response.data.etablissement;
    } catch (e) {
      throw new ApiError("Api Entreprise getEtablissement", e.message, e.code || e.response.status);
    }
  });
};

export const getConventionCollective = async (siret, non_diffusables = true) => {
  return executeWithRateLimiting(async (client) => {
    try {
      logger.debug(`[Entreprise API] Fetching convention collective ${siret}...`);
      let response = await client.get(`conventions_collectives/${siret}`, {
        params: { ...apiParams, non_diffusables },
      });
      if (!response?.data?.conventions[0]) {
        throw new ApiError("Api Entreprise", "error getConventionCollective");
      }
      return response.data.conventions[0];
    } catch (e) {
      if (e.response.status === 404) {
        return { active: null, date_publication: null, etat: null, titre_court: null, titre: null, url: null };
      } else {
        throw new ApiError("Api Entreprise ConventionCollective", e.message, e.code || e.response.status);
      }
    }
  });
};
