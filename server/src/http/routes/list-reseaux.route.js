const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const networkList = Object.keys(RESEAUX_CFAS).map((network) => network);
      return res.json(networkList);
    })
  );

  return router;
};
