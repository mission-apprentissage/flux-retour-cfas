const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      return res.json(RESEAUX_CFAS);
    })
  );

  return router;
};
