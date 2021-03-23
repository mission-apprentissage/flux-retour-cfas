const { codesStatutsCandidats } = require("../../../common/model/constants");

const computeStatsForStatutsCandidats = (statutsCandidats = []) => {
  return {
    nbStatutsCandidats: statutsCandidats.length,
    nbStatutsProspect: statutsCandidats.filter(
      ({ statut_apprenant }) => statut_apprenant === codesStatutsCandidats.prospect
    ).length,
    nbStatutsInscrit: statutsCandidats.filter(
      ({ statut_apprenant }) => statut_apprenant === codesStatutsCandidats.inscrit
    ).length,
    nbStatutsApprentis: statutsCandidats.filter(
      ({ statut_apprenant }) => statut_apprenant === codesStatutsCandidats.apprenti
    ).length,
    nbStatutsAbandon: statutsCandidats.filter(
      ({ statut_apprenant }) => statut_apprenant === codesStatutsCandidats.abandon
    ).length,
    nbStatutsAbandonProspects: statutsCandidats.filter(
      ({ statut_apprenant }) => statut_apprenant === codesStatutsCandidats.abandonProspects
    ).length,
  };
};

module.exports = computeStatsForStatutsCandidats;
