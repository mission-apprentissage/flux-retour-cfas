import { ObjectId } from "mongodb";

import { getCfdInfo } from "@/common/apis/apiTablesCorrespondances";
import logger from "@/common/logger";
import { formationsDb, effectifsDb } from "@/common/model/collections";
import { validateFormation } from "@/common/model/formations.model";
import { escapeRegExp } from "@/common/utils/regexUtils";
import { validateCfd } from "@/common/validation/utils/cfd";

import { buildMongoPipelineFilterStages } from "./helpers/filters";

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Checks if formation with given CFD exists
 * @param {string} cfd
 * @return {Promise<boolean>} Does it exist
 */
export const existsFormation = async (cfd) => {
  const count = await formationsDb().countDocuments({ cfd });
  return count !== 0;
};

/**
 * Returns formation if found with given CFD
 * @param {string} cfd
 * @return {Promise<Object | null>} Found formation
 */
export const getFormationWithCfd = async (cfd: string, projection: any = {}) => {
  return formationsDb().findOne({ cfd }, { projection });
};

export const getFormationWithRNCP = async (rncp: string, projection = {}) => {
  const normalizedRncp = rncp.toUpperCase().startsWith("RNCP") ? rncp.toUpperCase() : `RNCP${rncp}`;

  return formationsDb().findOne({ rncps: { $in: [normalizedRncp] } }, { projection });
};

/**
 * Méthode de récupération d'une formation depuis un id
 * @param {string|ObjectId} id
 * @param {*} projection
 * @returns
 */
export const findFormationById = async (id, projection = {}) => {
  return formationsDb().findOne({ _id: new ObjectId(id) }, { projection });
};

/**
 * Méthode d'extraction du niveau depuis le libelle de la formation
 * @param {*} niveauFormationLibelle
 * @returns
 */
export const getNiveauFormationFromLibelle = (niveauFormationLibelle) => {
  if (niveauFormationLibelle == null || niveauFormationLibelle === "") return null;

  const niveau = niveauFormationLibelle.split(" ")[0];
  return isNaN(parseInt(niveau, 10)) ? null : niveau;
};

/**
 * Création d'une formation à partir du cfd / durée & année optionnelles provenant du catalogue
 * Va faire un appel API aux TCO puis à LBA pour remplir les données de la formation
 * @param {Object} formation - Formation à créer
 * @param {string} formation.cfd - CFD de la formation
 * @param {string|null} [formation.duree] - Durée théorique de la formation issue du catalogue si fournie
 * @param {string|null} [formation.annee] - Année de la formation issue du catalogue si fournie
 * @returns {Promise<ObjectId>} Id de la formation crée en base
 */
export const createFormation = async ({ cfd, duree = null, annee = null }) => {
  if (!validateCfd(cfd)) {
    throw Error("Invalid CFD");
  }

  const alreadyExists = await existsFormation(cfd);
  if (alreadyExists) {
    throw new Error(`A Formation with CFD ${cfd} already exists`);
  }

  // Call TCO Api
  const formationInfo = await getCfdInfo(cfd);

  // Libelle
  const libelleFormationBuilt = formationInfo?.intitule_long || "";

  const { insertedId } = await formationsDb().insertOne(
    validateFormation({
      cfd,
      cfd_start_date: formationInfo?.date_ouverture ? new Date(formationInfo?.date_ouverture) : null, // timestamp format is returned by TCO
      cfd_end_date: formationInfo?.date_fermeture ? new Date(formationInfo?.date_fermeture) : null, // timestamp format is returned by TCO
      rncps: formationInfo?.rncps?.map((item) => item.code_rncp) || [], // Returned by TCO
      libelle: libelleFormationBuilt,
      niveau: getNiveauFormationFromLibelle(formationInfo?.niveau),
      niveau_libelle: formationInfo?.niveau,
      metiers: [],
      duree,
      annee,
      created_at: new Date(),
      updated_at: null,
    })
  );

  return insertedId;
};

/**
 * Returns list of formations whose matching search criteria
 * @param {Object} searchCriteria
 * @return {Promise<Object[]>} Array of formations
 */
export const searchFormations = async (searchCriteria) => {
  let start = Date.now();
  const eligibleCfds = (
    await effectifsDb()
      .aggregate([...buildMongoPipelineFilterStages(searchCriteria), { $group: { _id: "$formation.cfd" } }])
      .toArray()
  ).map((row) => row._id);
  logger.info({ elapsted: Date.now() - start, eligibleCfds: eligibleCfds.length }, "searchFormations_eligibleCfds");

  const matchStage = searchCriteria.searchTerm
    ? {
        $or: [
          { $text: { $search: searchCriteria.searchTerm, $caseSensitive: false, $diacriticSensitive: false } },
          { libelle: { $regex: searchCriteria.searchTerm, $options: "i" } },
          { cfd: new RegExp(escapeRegExp(searchCriteria.searchTerm), "g") },
          { rncps: new RegExp(escapeRegExp(searchCriteria.searchTerm), "gi") },
        ],
        cfd: { $in: eligibleCfds },
      }
    : { cfd: { $in: eligibleCfds } };

  const sortStage = searchCriteria.searchTerm
    ? {
        score: { $meta: "textScore" },
        libelle: 1,
      }
    : { libelle: 1 };

  start = Date.now();

  const formations = await formationsDb()
    .aggregate([{ $match: matchStage }, { $sort: sortStage }, { $limit: SEARCH_RESULTS_LIMIT }])
    .toArray();

  logger.info({ elapsted: Date.now() - start, formations: formations.length }, "searchFormations_formations");
  return formations;
};
