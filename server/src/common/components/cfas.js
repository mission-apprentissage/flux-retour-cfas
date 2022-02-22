const { getDepartementCodeFromUai } = require("../domain/uai");
const { StatutCandidatModel, CfaAnnuaireModel, CfaModel } = require("../model");
const { escapeRegExp } = require("../utils/regexUtils");

module.exports = () => ({
  searchCfas,
  getCfaFirstTransmissionDateFromUai,
  getCfaFirstTransmissionDateFromSiret,
  getSiretNatureFromAnnuaire,
  getSousEtablissementsForUai,
  getFromAccessToken,
  getFromUai,
});

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Returns list of CFA information matching passed criteria
 * @param {{}} searchCriteria
 * @return {Array<{uai: string, nom: string}>} Array of CFA information
 */
const searchCfas = async (searchCriteria) => {
  const { searchTerm, ...otherCriteria } = searchCriteria;

  const matchStage = {};
  if (searchTerm) {
    matchStage.$or = [{ $text: { $search: searchTerm } }, { uai: new RegExp(escapeRegExp(searchTerm), "g") }];
  }
  // if other criteria have been provided, find the list of uai matching those criteria in the StatutCandidat collection
  if (Object.keys(otherCriteria).length > 0) {
    const eligibleUais = await StatutCandidatModel.distinct("uai_etablissement", otherCriteria);
    matchStage.uai = { $in: eligibleUais };
  }

  const sortStage = searchTerm
    ? {
        score: { $meta: "textScore" },
        nom_etablissement: 1,
      }
    : { nom_etablissement: 1 };

  const found = await CfaModel.aggregate([
    { $match: matchStage },
    { $sort: sortStage },
    { $limit: SEARCH_RESULTS_LIMIT },
  ]);

  return found.map((cfa) => {
    return {
      uai: cfa.uai,
      nom: cfa.nom,
      departement: getDepartementCodeFromUai(cfa.uai),
    };
  });
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
  const cfaInAnnuaireFromSiret = await CfaAnnuaireModel.findOne({ siret: siret }).lean();
  return { responsable: cfaInAnnuaireFromSiret?.responsable, formateur: cfaInAnnuaireFromSiret?.formateur };
};

const getFromAccessToken = async (accessToken) => {
  return CfaModel.findOne({ access_token: accessToken }).lean();
};

const getFromUai = async (uai) => {
  return CfaModel.findOne({ uai }).lean();
};
