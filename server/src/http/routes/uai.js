const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { StatutCandidat } = require("../../common/model");
const { codesStatutsCandidats } = require("../../common/model/constants");

module.exports = ({ userEvents, cfas }) => {
  const router = express.Router();

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { uai } = req.body;

      const nbUsersEventsData = await userEvents.countDataForUai(uai);
      const cfaName = await cfas.getCfaNameByUai(uai);
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
      const nbAbandonProspects = await StatutCandidat.countDocuments({
        statut_apprenant: codesStatutsCandidats.abandonProspects,
        uai_etablissement: uai,
      });

      return res.json({
        cfaName,
        nbUsersEventsData,
        nbProspects,
        nbInscrits,
        nbApprentis,
        nbAbandon,
        nbAbandonProspects,
      });
    })
  );

  return router;
};
