const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

const mapCfasToApiOutput = (reseauxCfas) => {
  return {
    nom_reseau: reseauxCfas.nom_reseau,
    nom_etablissement: reseauxCfas.nom_etablissement,
    uai: reseauxCfas.uai,
    siret: reseauxCfas.siret,
    created_at: reseauxCfas.created_at,
  };
};

module.exports = ({ reseauxCfas }) => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const allReseauxCfas = await reseauxCfas.getAll();
      const reseauxCfasMapped = allReseauxCfas.map(mapCfasToApiOutput);
      return res.json(reseauxCfasMapped);
    })
  );

  return router;
};
