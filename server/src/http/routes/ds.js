const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { DsStats, DsDossier } = require("../../common/model");

module.exports = () => {
  const router = express.Router();

  /** Route for stats */
  router.get(
    "/stats",
    tryCatch(async (req, res) => {
      // Return empty data if no dossiers
      if ((await DsDossier.countDocuments({})) === 0)
        return res.json({ statsDs: [], missingSirets: [], missingSirens: [] });

      const statsDs = await DsStats.findOne({ globalStats: { $ne: null } }).map((item) => item._doc);

      const missingSirets = (
        await DsDossier.distinct("dossier.entreprise.siret").find({
          siret_present_catalogue: false,
        })
      ).map((item) => item.dossier.entreprise.siret_siege_social);

      const missingSirens = (
        await DsDossier.distinct("dossier.entreprise.siren").find({
          siren_present_catalogue: false,
        })
      ).map((item) => item.dossier.entreprise.siren);

      return res.json({ statsDs, missingSirets, missingSirens });
    })
  );

  /** Route for erpsAutres */
  router.get(
    "/commentaires",
    tryCatch(async (req, res) => {
      // Return empty data if no dossiers
      if ((await DsDossier.countDocuments({})) === 0) return res.json({ reponses: [] });

      const commentairesDs = (await DsDossier.find({})).map((item) => ({
        num_dossier: item._doc.dossier.id,
        mail_contact: item._doc.dossier.email,
        commentaire: item._doc.dossier.questions.commentairesMerci,
        erp_autre: item._doc.dossier.questions.erpNomAutre,
      }));

      return res.json({ reponses: commentairesDs });
    })
  );

  return router;
};
