const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

const mapCfasToApiOutput = (reseauxCfas) => {
  return {
    id: reseauxCfas._id,
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

  router.post(
    "/",
    tryCatch(async (req, res) => {
      const { nom_reseau, nom_etablissement, uai } = req.body;

      const createReseauCfa = await reseauxCfas.create({
        nom_reseau: nom_reseau,
        nom_etablissement: nom_etablissement,
        uai: uai,
      });
      return res.json(createReseauCfa);
    })
  );

  router.delete(
    "/delete/:id",
    tryCatch(async (req, res) => {
      const { reseauCfa } = req.params;
      await reseauxCfas.delete(reseauCfa);

      return res.json("deleted");
    })
  );

  return router;
};
