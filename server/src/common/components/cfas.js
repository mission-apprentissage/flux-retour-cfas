const { StatutCandidat: StatutCandidatModel } = require("../model");

module.exports = () => ({
  searchCfasByNomEtablissementOrUai,
  getCfaNameByUai,
});

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Returns list of CFA information whose nom_etablissement matches input
 * @param {string} nomEtablissementOrUai
 * @return {[{siret_etablissement: string, nom_etablissement: string}]} Array of CFA information
 */
const searchCfasByNomEtablissementOrUai = async (nomEtablissementOrUai, otherFilters) => {
  if (!nomEtablissementOrUai) {
    throw new Error("param nomEtablissementOrUai is required");
  }

  const found = await StatutCandidatModel.aggregate([
    {
      $match: {
        $or: [{ $text: { $search: nomEtablissementOrUai } }, { uai_etablissement: nomEtablissementOrUai }],
        siret_etablissement_valid: true,
        ...otherFilters,
      },
    },
    {
      $group: {
        _id: "$siret_etablissement",
        nom_etablissement: { $first: "$nom_etablissement" },
        etablissement_num_departement: { $first: "$etablissement_num_departement" },
      },
    },
    {
      $limit: SEARCH_RESULTS_LIMIT,
    },
    {
      $project: {
        _id: 0,
        siret_etablissement: "$_id",
        nom_etablissement: 1,
        etablissement_num_departement: 1,
      },
    },
  ]);

  return found;
};

const getCfaNameByUai = async (uai) => {
  const statutCandidatWithUai = await StatutCandidatModel.findOne({ uai_etablissement: uai });

  return statutCandidatWithUai ? statutCandidatWithUai.nom_etablissement : null;
};
