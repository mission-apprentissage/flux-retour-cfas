const { StatutCandidat: StatutCandidatModel } = require("../model");

module.exports = () => ({
  searchCfasByNomEtablissement,
});

/**
 * Returns list of CFA information whose nom_etablissement matches input
 * @param {string} nomEtablissement
 * @return {[{siret_etablissement: string, nom_etablissement: string}]} Array of CFA information
 */
const searchCfasByNomEtablissement = async (nomEtablissement) => {
  if (!nomEtablissement) {
    throw new Error("param nomEtablissement is required");
  }

  const found = await StatutCandidatModel.aggregate([
    {
      $match: { $text: { $search: nomEtablissement }, siret_etablissement_valid: true },
    },
    {
      $group: {
        _id: "$siret_etablissement",
        nom_etablissement: { $first: "$nom_etablissement" },
      },
    },
    {
      $limit: 50,
    },
    {
      $project: {
        _id: 0,
        siret_etablissement: "$_id",
        nom_etablissement: 1,
      },
    },
  ]);

  return found;
};
