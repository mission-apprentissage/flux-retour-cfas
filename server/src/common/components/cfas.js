const config = require("../../../config");
const { StatutCandidat: StatutCandidatModel, CfaAnnuaire, Cfa } = require("../model");

module.exports = () => ({
  searchCfas,
  getCfaFirstTransmissionDateFromUai,
  getCfaFirstTransmissionDateFromSiret,
  getSiretNatureFromAnnuaire,
  getSousEtablissementsForUai,
  getUrlTdbFromAccessToken,
  getFromAccessToken,
});

const SEARCH_RESULTS_LIMIT = 100;

/**
 * Returns list of CFA information matching passed criteria
 * @param {{}} searchCriteria
 * @return {Array<{uai_etablissement: string, nom_etablissement: string, etablissement_num_departement: string}>} Array of CFA information
 */
const searchCfas = async (searchCriteria) => {
  const { searchTerm, ...otherCriteria } = searchCriteria;
  const matchQuery = {
    ...otherCriteria,
    ...(searchTerm
      ? {
          $or: [{ $text: { $search: searchTerm } }, { uai_etablissement: searchTerm.toUpperCase() }],
        }
      : {}),
  };

  const found = await StatutCandidatModel.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: "$uai_etablissement",
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
        uai_etablissement: "$_id",
        nom_etablissement: 1,
        etablissement_num_departement: 1,
      },
    },
  ]);

  return found;
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
 * @returns {Date|null}
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
 * Returns sous-établissements by siret_etablissement for an uai_etablissement
 * @param {string} uai_etablissement
 * @returns {Array<{siret_etablissement: string, nom_etablissement: string}>}
 */
const getSousEtablissementsForUai = (uai) => {
  return StatutCandidatModel.aggregate([
    { $match: { uai_etablissement: uai, siret_etablissement: { $ne: null } } },
    { $group: { _id: "$siret_etablissement", nom_etablissement: { $first: "$nom_etablissement" } } },
    { $project: { _id: 0, siret_etablissement: "$_id", nom_etablissement: "$nom_etablissement" } },
  ]);
};

/**
 * Identify from a siret in cfasAnnuaire if cfa is responsable and / or formateur
 * @param {string} siret
 * @returns
 */
const getSiretNatureFromAnnuaire = async (siret) => {
  const cfaInAnnuaireFromSiret = await CfaAnnuaire.findOne({ siret: siret }).lean();
  return { responsable: cfaInAnnuaireFromSiret?.responsable, formateur: cfaInAnnuaireFromSiret?.formateur };
};

const getUrlTdbFromAccessToken = (accessToken) => `${config.publicUrl}/cfa/${accessToken}`;

const getFromAccessToken = async (accessToken) => {
  return Cfa.findOne({ url_access_token: accessToken }).lean();
};
