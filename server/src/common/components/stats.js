const { StatutCandidat } = require("../../common/model");

module.exports = async () => {
  return {
    getNbStatutCandidatsTotal,
    getNbStatutCandidats,
  };
};

const getNbStatutCandidatsTotal = async () => await StatutCandidat.countDocuments({});
const getNbStatutCandidats = async (statutCandidat) =>
  await StatutCandidat.countDocuments({
    statut_apprenant: statutCandidat,
  });
