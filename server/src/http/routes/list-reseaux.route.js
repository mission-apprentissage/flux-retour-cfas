const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");

const CFAS_NETWORKS = [
  RESEAUX_CFAS.CMA,
  RESEAUX_CFAS.UIMM,
  RESEAUX_CFAS.AGRI,
  RESEAUX_CFAS.MFR,
  RESEAUX_CFAS.CCI,
  RESEAUX_CFAS.CFA_EC,
  RESEAUX_CFAS.GRETA,
  RESEAUX_CFAS.AFTRAL,
];

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const listNetwork = CFAS_NETWORKS.map(({ nomReseau }) => nomReseau);
      return res.json(listNetwork);
    })
  );

  return router;
};
