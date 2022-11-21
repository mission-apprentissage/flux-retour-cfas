import { ObjectId } from "mongodb";
import { getDepartementCodeFromUai, validateUai } from "../domain/uai.js";
import { escapeRegExp } from "../utils/regexUtils.js";
import { Cfa } from "../factory/cfa.js";
import { getMetiersBySirets } from "../../common/apis/apiLba.js";
import logger from "../../common/logger.js";
import { validateNatureOrganismeDeFormation } from "../domain/organisme-de-formation/nature.js";
import { cfasDb, dossiersApprenantsDb } from "../model/collections.js";

const SEARCH_RESULTS_LIMIT = 50;

const getFromSiret = async (siret) => {
  return await cfasDb()
    .find({
      sirets: siret,
    })
    .toArray();
};

/**
 * Checks if cfa with given UAI exists
 * @param {string} uai
 * @return {boolean} Does it exist
 */
const existsCfa = async (uai) => {
  const count = await cfasDb().countDocuments({ uai });
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

  let metiersFromSirets = null;

  if (Array.isArray(sirets) && sirets.length !== 0) {
    try {
      const { metiers } = await getMetiersBySirets(sirets);
      metiersFromSirets = metiers ?? [];
    } catch {
      logger.error(
        `createCfa / getMetiersBySirets: something went wrong while requesting for cfa with uai ${dossierForCfa.uai_etablissement}`
      );
    }
  }

  const cfaEntity = Cfa.create({
    uai: dossierForCfa.uai_etablissement,
    sirets,
    nom: dossierForCfa.nom_etablissement.trim() ?? null,
    adresse: dossierForCfa.etablissement_adresse,
    erps: [dossierForCfa.source],
    region_nom: dossierForCfa.etablissement_nom_region,
    region_num: dossierForCfa.etablissement_num_region,
    metiers: metiersFromSirets,
    first_transmission_date: await getCfaFirstTransmissionDateFromUai(dossierForCfa.uai_etablissement),
  });

  if (cfaEntity) {
    const { insertedId } = await cfasDb().insertOne(cfaEntity);
    // TODO return only the id instead of the created object (single responsibility)
    return await cfasDb().findOne({ _id: insertedId });
  }

  // retourner une erreur lorsque la création a échoué
  return null;
};

/**
 * Update a cfa from id / dossier
 * @param {*} cfaId
 * @param {*} dossierForCfa
 * @param {*} sirets
 */
const updateCfa = async (cfaId, dossierForCfa, sirets = []) => {
  const _id = new ObjectId(cfaId);
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  if (validateUai(dossierForCfa.uai_etablissement).error) {
    throw Error("Invalid Uai");
  }

  const cfaToUpdate = await cfasDb().findOne({ _id });
  if (!cfaToUpdate) {
    throw new Error(`Can't update cfa with id ${cfaId} it does not exists`);
  }

  await cfasDb().updateOne(
    { _id },
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

  const cfaToUpdate = await cfasDb().findOne({ uai });
  if (!cfaToUpdate) {
    throw new Error(`Can't update cfa with uai ${uai} : not found`);
  }

  await cfasDb().updateOne(
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
 * @param {string} uai of the organisme de formation
 * @param {[string]} reseaux new list of reseaux
 * @return void
 */
const updateCfaReseauxFromUai = async (uai, reseaux = []) => {
  const cfaToUpdate = await cfasDb().findOne({ uai });
  if (!cfaToUpdate) {
    throw new Error(`Can't update cfa with uai ${uai} : not found`);
  }

  await cfasDb().updateOne(
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
    const eligibleUais = await dossiersApprenantsDb().distinct("uai_etablissement", otherCriteria);
    matchStage.uai = { $in: eligibleUais };
  }

  const sortStage = searchTerm
    ? {
        score: { $meta: "textScore" },
        nom_etablissement: 1,
      }
    : { nom_etablissement: 1 };

  const found = await cfasDb()
    .aggregate([{ $match: matchStage }, { $sort: sortStage }, { $limit: SEARCH_RESULTS_LIMIT }])
    .toArray();

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
  const historiqueDatesDossierApprenantWithUai = await dossiersApprenantsDb()
    .find({ uai_etablissement: uai })
    .sort("created_at")
    .limit(1)
    .toArray();

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
  const historiqueDatesDossiersApprenantsWithSiret = await dossiersApprenantsDb()
    .find({ siret_etablissement: siret })
    .sort("created_at")
    .limit(1)
    .toArray();

  return historiqueDatesDossiersApprenantsWithSiret.length > 0
    ? historiqueDatesDossiersApprenantsWithSiret[0].created_at
    : null;
};

/**
 * Returns sous-établissements by siret_etablissement for an uai_etablissement
 * @param {string} uai_etablissement
 * @returns {Array<{siret_etablissement: string, nom_etablissement: string}>}
 */
const getSousEtablissementsForUai = async (uai) => {
  return await dossiersApprenantsDb()
    .aggregate([
      { $match: { uai_etablissement: uai, siret_etablissement: { $ne: null } } },
      { $group: { _id: "$siret_etablissement", nom_etablissement: { $first: "$nom_etablissement" } } },
      { $project: { _id: 0, siret_etablissement: "$_id", nom_etablissement: "$nom_etablissement" } },
    ])
    .toArray();
};

/**
 * Identify from a siret in cfasAnnuaire if cfa is responsable and / or formateur
 * @param {string} siret
 * @returns
 */

const getFromAccessToken = async (accessToken) => {
  return await cfasDb().findOne({ access_token: accessToken });
};

const getFromUai = async (uai) => {
  return await cfasDb().findOne({ uai });
};

// TODO à tester
const getFromUaiAndSiret = async (uai, siret) => {
  return await cfasDb()
    .find({
      uai,
      sirets: siret,
    })
    .toArray();
};

export default () => ({
  createCfa,
  existsCfa,
  updateCfa,
  updateCfaNature,
  updateCfaReseauxFromUai,
  getFromSiret,
  searchCfas,
  getCfaFirstTransmissionDateFromUai,
  getCfaFirstTransmissionDateFromSiret,
  getSousEtablissementsForUai,
  getFromAccessToken,
  getFromUai,
  getFromUaiAndSiret,
});
