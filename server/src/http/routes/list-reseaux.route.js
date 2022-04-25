const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

const mapReseauxToApiOutput = (listReseaux) => {
  return {
    network: listReseaux.network,
  };
};

module.exports = ({ listReseaux }) => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const allResaux = await listReseaux.getAll();
      const listReseauxMapped = allResaux.map(mapReseauxToApiOutput);
      return res.json(listReseauxMapped);
    })
  );

  return router;
};
