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

  const results = await StatutCandidatModel.find({
    $text: { $search: nomEtablissement },
  })
    .limit(50)
    .lean();

  return results.map((result) => ({
    nom_etablissement: result.nom_etablissement,
    siret_etablissement: result.siret_etablissement,
  }));
};
