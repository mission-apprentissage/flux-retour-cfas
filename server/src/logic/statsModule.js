const { StatutCandidat } = require("../common/model");
const { codesStatutsCandidats } = require("../common/model/constants");

module.exports = async () => {
  const nbStatutsCandidatsTotal = await StatutCandidat.countDocuments({});
  const nbStatutsCandidatsPropects = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.prospect,
  });
  const nbStatutsCandidatsInscrit = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.inscrit,
  });
  const nbStatutsCandidatsApprenti = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.apprenti,
  });
  const nbStatutsCandidatsAbandon = await StatutCandidat.countDocuments({
    statut_apprenant: codesStatutsCandidats.abandon,
  });

  return {
    getStats: async () => {
      return {
        nbStatutsCandidatsTotal,
        nbStatutsCandidatsPropects,
        nbStatutsCandidatsInscrit,
        nbStatutsCandidatsApprenti,
        nbStatutsCandidatsAbandon,
      };
    },
  };
};
