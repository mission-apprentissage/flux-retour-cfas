const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const validateRequestBody = require("../middlewares/validateRequestBody");

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

  // TODO à tester
  router.post(
    "/",
    tryCatch(async (req, res) => {
      const { nom_reseau, nom_etablissement, uai, siret } = req.body;

      const createReseauCfa = await reseauxCfas.create({
        nom_reseau,
        nom_etablissement,
        uai,
        siret,
      });
      return res.json(createReseauCfa);
    })
  );

  router.post(
    "/search",
    validateRequestBody(
      Joi.object({
        searchTerm: Joi.string().min(3),
      })
    ),
    tryCatch(async (req, res) => {
      const foundReseauxCfas = await reseauxCfas.searchReseauxCfas(req.body);
      return res.json(foundReseauxCfas);
    })
  );

  router.delete(
    "/delete/:id",
    tryCatch(async (req, res) => {
      const { id } = req.params;

      // TODO use Joi schema to handle missing id
      if (id !== undefined) {
        await reseauxCfas.delete(id);
        return res.json({
          status: "Success",
          message: "Reseau cfa has been deleted",
        });
      } else {
        return res.json({
          status: "Error",
          message: "ID Undefined",
        });
      }
    })
  );

  return router;
};
