const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { reseauxCfas, regionsCfas } = require("../../common/model/constants");

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
    "/regions-cfas",
    tryCatch(async (req, res) => {
      const networks = Object.keys(regionsCfas).map((id) => ({
        id,
        nom: regionsCfas[id].nomRegion,
        num: regionsCfas[id].numRegion,
      }));
      return res.json(networks);
    })
  );

  return router;
};
