const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { reseauxCfas, jobNames } = require("../../common/model/constants");
const permissionsMiddleware = require("../middlewares/permissionsMiddleware");
const { administrator } = require("../../common/roles");

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
    "/jobNames",
    permissionsMiddleware([administrator]),
    tryCatch(async (req, res) => {
      return res.json({ jobNames: jobNames });
    })
  );

  return router;
};
