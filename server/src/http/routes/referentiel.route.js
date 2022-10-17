const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");
const { REGIONS, DEPARTEMENTS } = require("../../common/constants/territoiresConstants");
const { ORGANISMES_APPARTENANCE } = require("../../common/constants/usersConstants");

module.exports = ({ db, cfas }) => {
  const router = express.Router();

  router.get(
    "/networks",
    tryCatch(async (req, res) => {
      const networks = Object.keys(RESEAUX_CFAS).map((id) => ({ id, nom: RESEAUX_CFAS[id].nomReseau }));
      return res.json(networks);
    })
  );

  // consumed by Referentiel SIRET-UAI
  router.get(
    "/siret-uai-reseaux",
    tryCatch(async (req, res) => {
      const referentielSiretUaiCursor = db.collection("referentielSiret").find();

      const mappingResult = [];

      while (await referentielSiretUaiCursor.hasNext()) {
        const organismeReferentiel = await referentielSiretUaiCursor.next();

        const organismesTdb = await cfas.getFromSiret(organismeReferentiel.siret);
        const reseaux = organismesTdb.map((organisme) => organisme.reseaux).flat();

        mappingResult.push({
          siret: organismeReferentiel.siret,
          uai: organismeReferentiel.uai,
          reseaux,
        });
      }

      return res.json({ organismes: mappingResult });
    })
  );

  router.get(
    "/regions",
    tryCatch(async (req, res) => {
      return res.json(REGIONS);
    })
  );

  router.get(
    "/departements",
    tryCatch(async (req, res) => {
      return res.json(DEPARTEMENTS);
    })
  );

  router.get(
    "/organismes-appartenance",
    tryCatch(async (req, res) => {
      const organismes = Object.keys(ORGANISMES_APPARTENANCE).map((id) => ({ id, nom: ORGANISMES_APPARTENANCE[id] }));
      return res.json(organismes);
    })
  );

  return router;
};
