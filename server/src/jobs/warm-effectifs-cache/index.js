import axios from "axios";
import { runScript } from "../scriptWrapper.js";
import logger from "../../common/logger.js";
import config from "../../../config.js";
import { JOB_NAMES } from "../../common/constants/jobsConstants.js";
import { REGIONS } from "../../common/constants/territoiresConstants.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";

const ROUTES_TO_WARM_UP = ["/api/effectifs", "/api/effectifs/niveau-formation", "/api/effectifs/departement"];

/*
    This job will perform expensive requests made by the UI to warm up the cache
*/
runScript(async () => {
  logger.info("START", JOB_NAMES.warmUpCache);

  const response = await axios.post(`${config.publicUrl}/api/login`, {
    username: config.users.defaultAdmin.name,
    password: config.users.defaultAdmin.password,
  });
  const { access_token } = response.data;

  const performRequest = (route, params = {}) => {
    return axios.get(`${config.publicUrl}${route}`, {
      params,
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  };

  const commonParams = {
    date: new Date().toISOString(),
  };

  // warm up cache with effectifs on national level (we don't need repartition by departement)
  logger.info(`Warming up cache for national effectifs`);
  await performRequest(ROUTES_TO_WARM_UP[0], commonParams);
  await performRequest(ROUTES_TO_WARM_UP[1], commonParams);
  await performRequest("/api/effectifs-national", commonParams);

  await asyncForEach(ROUTES_TO_WARM_UP, async (route) => {
    // warm up cache with effectifs for every regions
    await asyncForEach(REGIONS, async (region) => {
      logger.info(`Warming up cache for route ${route} for region ${region.nom}`);
      await performRequest(route, {
        ...commonParams,
        etablissement_num_region: region.code,
      });
    });
  });
  logger.info("END", JOB_NAMES.warmUpCache);
}, JOB_NAMES.warmUpCache);
