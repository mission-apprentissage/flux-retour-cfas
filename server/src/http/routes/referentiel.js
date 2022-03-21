const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");
const { REGIONS } = require("../../common/constants/localisationConstants");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/networks",
    tryCatch(async (req, res) => {
      const networks = Object.keys(RESEAUX_CFAS).map((id) => ({ id, nom: RESEAUX_CFAS[id].nomReseau }));
      return res.json(networks);
    })
  );

  router.get(
    "/regions",
    tryCatch(async (req, res) => {
      return res.json(REGIONS);
    })
  );

  return router;
};
