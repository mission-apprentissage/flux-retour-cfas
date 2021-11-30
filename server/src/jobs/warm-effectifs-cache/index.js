const axios = require("axios");
const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const config = require("../../../config");
const { jobNames, REGIONS_DEPLOYEES } = require("../../common/model/constants");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const ROUTES_TO_WARM_UP = [
  "/api/dashboard/effectifs",
  "/api/dashboard/effectifs-par-departement",
  "/api/dashboard/effectifs-par-niveau-formation",
];

/*
    This job will perform expensive requests made by the UI to warm up the cache
*/
runScript(async () => {
  logger.info("START", jobNames.warmUpCache);

  const response = await axios.post("/api/login", {
    username: config.users.defaultAdmin.name,
    password: config.users.defaultAdmin.password + 1,
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

  await asyncForEach(ROUTES_TO_WARM_UP, async (route) => {
    // warm up cache with effectifs on national level
    logger.info(`Warming up cache for route ${route} on national level`);
    await performRequest(route, commonParams);

    // warm up cache with effectifs for every regions
    await asyncForEach(REGIONS_DEPLOYEES, async (region) => {
      logger.info(`Warming up cache for route ${route} for region ${region.nom}`);
      await performRequest(route, {
        ...commonParams,
        etablissement_num_region: region.code,
      });
    });
    logger.info("END", jobNames.warmUpCache);
  });
}, jobNames.warmUpCache);
