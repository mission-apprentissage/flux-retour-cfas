const express = require("express");
const permissionsMiddleware = require("../middlewares/permissionsMiddleware");
const { administrator } = require("../../common/roles");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { StatutCandidat } = require("../../common/model");
const { codesStatutsCandidats } = require("../../common/model/constants");

module.exports = ({ userEvents }) => {
  const router = express.Router();

  router.get(
    "/statutsCandidats/uai/:uai",
    permissionsMiddleware([administrator]),
    tryCatch(async (req, res) => {
      const { uai } = req.params;

      const nbUsersEventsData = await userEvents.countDataForUai(uai);
      const nbProspects = await StatutCandidat.countDocuments({
        statut_apprenant: codesStatutsCandidats.prospect,
        uai_etablissement: uai,
      });
      const nbInscrits = await StatutCandidat.countDocuments({
        statut_apprenant: codesStatutsCandidats.inscrit,
        uai_etablissement: uai,
      });
      const nbApprentis = await StatutCandidat.countDocuments({
        statut_apprenant: codesStatutsCandidats.apprenti,
        uai_etablissement: uai,
      });
      const nbAbandon = await StatutCandidat.countDocuments({
        statut_apprenant: codesStatutsCandidats.abandon,
        uai_etablissement: uai,
      });

      return res.json({
        nbUsersEventsData,
        nbProspects,
        nbInscrits,
        nbApprentis,
        nbAbandon,
      });
    })
  );

  return router;
};
