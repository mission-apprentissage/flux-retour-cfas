const axios = require("axios");
const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const config = require("../../../config");
const { reseauxCfas, REGIONS_DEPLOYEES } = require("../../common/model/constants");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/networks",
    tryCatch(async (req, res) => {
      const networks = Object.keys(reseauxCfas).map((id) => ({ id, nom: reseauxCfas[id].nomReseau }));
      return res.json(networks);
    })
  );

  router.get(
    "/regions",
    tryCatch(async (req, res) => {
      const { data } = await axios.get("https://geo.api.gouv.fr/regions");

      const regions = config.featureFlags.limitDeployedRegions === true ? REGIONS_DEPLOYEES : data;
      return res.json(regions);
    })
  );

  return router;
};
