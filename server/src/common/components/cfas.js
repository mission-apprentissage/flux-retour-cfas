const { getDepartementCodeFromUai, validateUai } = require("../domain/uai");
const { DossierApprenantModel, CfaModel } = require("../model");
const { escapeRegExp } = require("../utils/regexUtils");
const { Cfa } = require("../factory/cfa");
const { getMetiersBySirets } = require("../../common/apis/apiLba");
const logger = require("../../common/logger");
const { validateNatureOrganismeDeFormation } = require("../domain/organisme-de-formation/nature");

module.exports = () => ({
  createCfa,
  existsCfa,
  updateCfa,
  updateCfaNature,
  updateCfaReseauxFromUai,
  searchCfas,
  getCfaFirstTransmissionDateFromUai,
  getCfaFirstTransmissionDateFromSiret,
  getSousEtablissementsForUai,
  getFromAccessToken,
  getFromUai,
  getFromUaiAndSiret,
  getFromSiret,
});

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Checks if cfa with given UAI exists
 * @param {string} uai
 * @return {boolean} Does it exist
 */
const existsCfa = async (uai) => {
  const count = await CfaModel.countDocuments({ uai });
  return count !== 0;
};

/**
 * Create new CFA in Db
 * Checks uai format & existence
 * @param {*} cfa
 */
const createCfa = async (dossierForCfa, sirets = []) => {
  const alreadyExists = await existsCfa(dossierForCfa.uai_etablissement);
  if (alreadyExists) {
    throw new Error(`A Cfa with UAI ${dossierForCfa.uai_etablissement} already exists`);
  }

  if (!dossierForCfa) {
    throw new Error(`No dossierApprenant found`);
  }

  let metiersFromSirets = [];

  try {
    metiersFromSirets = await getMetiersBySirets(sirets);
  } catch {
    logger.error(
      `createCfa / getMetiersBySirets: something went wrong while requesting for cfa with uai ${dossierForCfa.uai_etablissement}`
    );
  }

  const cfaEntity = Cfa.create({
    uai: dossierForCfa.uai_etablissement,
    sirets,
    nom: dossierForCfa.nom_etablissement.trim() ?? null,
    adresse: dossierForCfa.etablissement_adresse,
    erps: [dossierForCfa.source],
    region_nom: dossierForCfa.etablissement_nom_region,
    region_num: dossierForCfa.etablissement_num_region,
    metiers: metiersFromSirets?.metiers,
    first_transmission_date: await getCfaFirstTransmissionDateFromUai(dossierForCfa.uai_etablissement),
  });

  if (cfaEntity) {
    const saved = await new CfaModel(cfaEntity).save();
    return saved.toObject();
  }

  return null;
};

/**
 * Update a cfa from id / dossier
 * @param {*} cfaId
 * @param {*} dossierForCfa
 * @param {*} sirets
 */
const updateCfa = async (cfaId, dossierForCfa, sirets = []) => {
  if (!cfaId) {
    throw Error("Id not found");
  }

  if (validateUai(dossierForCfa.uai_etablissement).error) {
    throw Error("Invalid Uai");
  }

  const cfaToUpdate = await CfaModel.findById(cfaId);
  if (!cfaToUpdate) {
    throw new Error(`Can't update cfa with id ${cfaId} it does not exists`);
  }

  await CfaModel.findOneAndUpdate(
    { _id: cfaId },
    {
      $set: {
        uai: dossierForCfa.uai_etablissement,
        nom: dossierForCfa.nom_etablissement.trim() ?? null,
        nom_tokenized: Cfa.createTokenizedNom(dossierForCfa.nom_etablissement),
        adresse: dossierForCfa.etablissement_adresse,
        sirets: sirets,
        erps: [dossierForCfa.source],
        region_nom: dossierForCfa.etablissement_nom_region,
        region_num: dossierForCfa.etablissement_num_region,
        first_transmission_date: await getCfaFirstTransmissionDateFromUai(dossierForCfa.uai_etablissement),
        updated_at: new Date(),
      },
    }
  );
};

const updateCfaNature = async (uai, { nature, natureValidityWarning }) => {
  if (validateNatureOrganismeDeFormation(nature).error) {
    throw new Error(`Can't update cfa with uai ${uai} : nature of value ${nature} is invalid`);
  }

  const cfaToUpdate = await CfaModel.findOne({ uai });
  if (!cfaToUpdate) {
    throw new Error(`Can't update cfa with uai ${uai} : not found`);
  }

  await CfaModel.findOneAndUpdate(
    { uai },
    {
      $set: {
        nature,
        nature_validity_warning: natureValidityWarning,
        updated_at: new Date(),
      },
    }
  );
};

/**
 * Returns list of CFA information matching passed criteria
 * @param {string} uai of the organisme de formation
 * @param {[string]} reseaux new list of reseaux
 * @return void
 */
const updateCfaReseauxFromUai = async (uai, reseaux = []) => {
  const cfaToUpdate = await CfaModel.findOne({ uai });
  if (!cfaToUpdate) {
    throw new Error(`Can't update cfa with uai ${uai} : not found`);
  }

  await CfaModel.findOneAndUpdate(
    { uai },
    {
      $set: {
        reseaux,
        updated_at: new Date(),
      },
    }
  );
};

/**
 * Returns list of CFA information matching passed criteria
 * @param {{}} searchCriteria
 * @return {Array<{uai: string, nom: string}>} Array of CFA information
 */
const searchCfas = async (searchCriteria) => {
  const { searchTerm, ...otherCriteria } = searchCriteria;

  const matchStage = {};
  if (searchTerm) {
    matchStage.$or = [
      { $text: { $search: searchTerm } },
      { uai: new RegExp(escapeRegExp(searchTerm), "g") },
      { sirets: new RegExp(escapeRegExp(searchTerm), "g") },
    ];
  }
  // if other criteria have been provided, find the list of uai matching those criteria in the DossierApprenant collection
  if (Object.keys(otherCriteria).length > 0) {
    const eligibleUais = await DossierApprenantModel.distinct("uai_etablissement", otherCriteria);
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
      sirets: cfa.sirets,
      nom: cfa.nom,
      nature: cfa.nature,
      departement: getDepartementCodeFromUai(cfa.uai),
    };
  });
};

/**
 * Returns the first date of dossierApprenant transmission for a UAI
 * @param {*} uai
 * @returns
 */
const getCfaFirstTransmissionDateFromUai = async (uai) => {
  const historiqueDatesDossierApprenantWithUai = await DossierApprenantModel.find({ uai_etablissement: uai })
    .sort("created_at")
    .limit(1)
    .lean();

  return historiqueDatesDossierApprenantWithUai.length > 0
    ? historiqueDatesDossierApprenantWithUai[0].created_at
    : null;
};

/**
 * Returns the first date of dossierApprenant transmission for a SIRET
 * @param {*} uai
 * @returns {Date|null}
 */
const getCfaFirstTransmissionDateFromSiret = async (siret) => {
  const historiqueDatesDossiersApprenantsWithSiret = await DossierApprenantModel.find({ siret_etablissement: siret })
    .sort("created_at")
    .limit(1)
    .lean();

  return historiqueDatesDossiersApprenantsWithSiret.length > 0
    ? historiqueDatesDossiersApprenantsWithSiret[0].created_at
    : null;
};

/**
 * Returns sous-établissements by siret_etablissement for an uai_etablissement
 * @param {string} uai_etablissement
 * @returns {Array<{siret_etablissement: string, nom_etablissement: string}>}
 */
const getSousEtablissementsForUai = (uai) => {
  return DossierApprenantModel.aggregate([
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

const getFromAccessToken = async (accessToken) => {
  return await CfaModel.findOne({ access_token: accessToken }).lean();
};

const getFromUai = async (uai) => {
  return await CfaModel.findOne({ uai }).lean();
};

const getFromUaiAndSiret = async (uai, siret) => {
  return await CfaModel.find({
    uai,
    sirets: siret,
  }).lean();
};

const getFromSiret = async (siret) => {
  return await CfaModel.find({
    sirets: siret,
  }).lean();
};
