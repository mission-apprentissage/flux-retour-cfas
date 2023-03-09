import axios from "axios";
import logger from "../logger";
import { ApiError, apiRateLimiter } from "../utils/apiUtils";

// Cf Documentation : https://www.cfadock.fr/Home/ApiDescription
const executeWithRateLimiting = apiRateLimiter("apiCfaDock", {
  //2 requests per second
  nbRequests: 2,
  durationInSeconds: 1,
  client: axios.create({
    baseURL: "https://www.cfadock.fr/api",
    timeout: 5000,
  }),
});

export const getOpcoData = (siret) => {
  return executeWithRateLimiting(async (client) => {
    try {
      logger.debug(`[CfaDock API] Search opco data ${siret}...`);
      let response = await client.get(`opcos/?siret=${siret}`);
      if (!response?.data?.searchStatus) {
        throw new ApiError("Api CFAdock", `No data found for siret=${siret}`);
      }
      return {
        idcc: response.data.idcc,
        opco_nom: response.data.opcoName,
        opco_siren: response.data.opcoSiren,
        status: response.data.searchStatus,
      };
    } catch (/** @type {any}*/ e) {
      throw new ApiError("Api CFAdock", `${e.message} for siret=${siret}`, e.code || e.response?.status);
    }
  });
};
