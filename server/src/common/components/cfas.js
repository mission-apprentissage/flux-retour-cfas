const { StatutCandidat: StatutCandidatModel } = require("../model");

module.exports = () => ({
  searchCfas,
  getCfaNameByUai,
});

const SEARCH_RESULTS_LIMIT = 100;

/**
 * Returns list of CFA information matching passed criteria
 * @param {{}} searchCriteria
 * @return {[{siret_etablissement: string, nom_etablissement: string, etablissement_num_departement: string}]} Array of CFA information
 */
const searchCfas = async (searchCriteria) => {
  const { searchTerm, ...otherCriteria } = searchCriteria;
  const matchQuery = {
    ...otherCriteria,
    ...(searchTerm ? { $or: [{ $text: { $search: searchTerm } }, { uai_etablissement: searchTerm }] } : {}),
    siret_etablissement_valid: true,
  };

  const found = await StatutCandidatModel.aggregate([
    {
      $match: matchQuery,
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
