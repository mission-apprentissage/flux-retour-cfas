const { StatutCandidat: StatutCandidatModel, CfaAnnuaire } = require("../model");

module.exports = () => ({
  searchCfas,
  getCfaNameByUai,
  getCfaFirstTransmissionDateFromUai,
  getCfaFirstTransmissionDateFromSiret,
  getSiretNatureFromAnnuaire,
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
    ...(searchTerm
      ? {
          $or: [
            { $text: { $search: searchTerm } },
            { uai_etablissement: searchTerm.toUpperCase() },
            { siret_etablissement: searchTerm },
          ],
        }
      : {}),
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

/**
 * Returns the first date of statutCandidat transmission for a UAI
 * @param {*} uai
 * @returns
 */
const getCfaFirstTransmissionDateFromUai = async (uai) => {
  const historiqueDatesStatutsCandidatsWithUai = await StatutCandidatModel.find({ uai_etablissement: uai })
    .sort("created_at")
    .limit(1)
    .lean();

  return historiqueDatesStatutsCandidatsWithUai.length > 0
    ? historiqueDatesStatutsCandidatsWithUai[0].created_at
    : null;
};

/**
 * Returns the first date of statutCandidat transmission for a SIRET
 * @param {*} uai
 * @returns
 */
const getCfaFirstTransmissionDateFromSiret = async (siret) => {
  const historiqueDatesStatutsCandidatsWithSiret = await StatutCandidatModel.find({ siret_etablissement: siret })
    .sort("created_at")
    .limit(1)
    .lean();

  return historiqueDatesStatutsCandidatsWithSiret.length > 0
    ? historiqueDatesStatutsCandidatsWithSiret[0].created_at
    : null;
};

/**
 * Identify from a siret in cfasAnnuaire if cfa is responsable and / or formateur
 * @param {*} siret
 * @returns
 */
const getSiretNatureFromAnnuaire = async (siret) => {
  const cfaInAnnuaireFromSiret = await CfaAnnuaire.findOne({ siret: siret }).lean();
  return { responsable: cfaInAnnuaireFromSiret?.responsable, formateur: cfaInAnnuaireFromSiret?.formateur };
};
