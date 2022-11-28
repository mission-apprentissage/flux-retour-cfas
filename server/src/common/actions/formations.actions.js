import { validateCfd } from "../utils/validationsUtils/cfd.js";
import { getCfdInfo } from "../apis/apiTablesCorrespondances.js";
import { getMetiersByCfd } from "../apis/apiLba.js";
import { escapeRegExp } from "../utils/regexUtils.js";
import logger from "../logger.js";
import { formationsDb, dossiersApprenantsDb } from "../model/collections.js";
import { validateFormation } from "../model/next.toKeep.models/formations.model.js";
import { buildTokenizedString } from "../utils/buildTokenizedString.js";

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Checks if formation with given CFD exists
 * @param {string} cfd
 * @return {boolean} Does it exist
 */
export const existsFormation = async (cfd) => {
  const count = await formationsDb().countDocuments({ cfd });
  return count !== 0;
};

/**
 * Returns formation if found with given CFD
 * @param {string} cfd
 * @return {Formation | null} Found formation
 */
export const getFormationWithCfd = async (cfd) => {
  return await formationsDb().findOne({ cfd });
};

export const buildFormationLibelle = (formationFromTCO) => {
  return formationFromTCO.intitule_long || "";
};

export const getNiveauFormationFromLibelle = (niveauFormationLibelle) => {
  if (niveauFormationLibelle == null || niveauFormationLibelle === "") return null;

  const niveau = niveauFormationLibelle.split(" ")[0];
  return isNaN(parseInt(niveau, 10)) ? null : niveau;
};

/**
 * Fetches data for given CFD in Tables de Correspondances and creates a new Formation in DB
 * @param {string} cfd
 * @return {Formation | null} The newly created Formation or null
 */
export const createFormation = async (cfd) => {
  if (!validateCfd(cfd)) {
    throw Error("Invalid CFD");
  }

  const alreadyExists = await existsFormation(cfd);
  if (alreadyExists) {
    throw new Error(`A Formation with CFD ${cfd} already exists`);
  }

  // Call TCO Api
  const formationInfo = await getCfdInfo(cfd);

  // Call LBA Api
  let metiersFromCfd = null;
  try {
    const { data } = await getMetiersByCfd(cfd);
    metiersFromCfd = data?.metiers;
  } catch {
    logger.error(`createFormation / getMetiersByCfd: something went wrong while requesting cfd ${cfd}`);
  }

  // Libelle
  const libelleFormationBuilt = buildFormationLibelle(formationInfo);
  const tokenizedLibelle = buildTokenizedString(libelleFormationBuilt || "", 3);

  const { insertedId } = await formationsDb().insertOne(
    validateFormation({
      cfd,
      cfd_start_date: formationInfo?.date_ouverture ? new Date(formationInfo?.date_ouverture) : null, // timestamp format is returned by TCO
      cfd_end_date: formationInfo?.date_fermeture ? new Date(formationInfo?.date_fermeture) : null, // timestamp format is returned by TCO
      rncps: formationInfo?.rncps?.map((item) => item.code_rncp) || [], // Returned by TCO
      libelle: libelleFormationBuilt,
      tokenized_libelle: tokenizedLibelle,
      niveau: getNiveauFormationFromLibelle(formationInfo?.niveau),
      niveau_libelle: formationInfo?.niveau,
      metiers: metiersFromCfd || [],
      created_at: new Date(),
      updated_at: null,
    })
  );

  return insertedId;
};

/**
 * Returns list of formations whose matching search criteria
 * @param {Object} searchCriteria
 * @return {[Formation]} Array of formations
 */
export const searchFormations = async (searchCriteria) => {
  const { searchTerm, ...otherFilters } = searchCriteria;

  const eligibleCfds = await dossiersApprenantsDb().distinct("formation_cfd", otherFilters);

  const matchStage = searchTerm
    ? {
        $or: [
          { $text: { $search: searchTerm } },
          { cfd: new RegExp(escapeRegExp(searchTerm), "g") },
          { rncps: new RegExp(escapeRegExp(searchTerm), "gi") },
        ],
        cfd: { $in: eligibleCfds },
      }
    : { cfd: { $in: eligibleCfds } };

  const sortStage = searchTerm
    ? {
        score: { $meta: "textScore" },
        libelle: 1,
      }
    : { libelle: 1 };

  return await formationsDb()
    .aggregate([{ $match: matchStage }, { $sort: sortStage }, { $limit: SEARCH_RESULTS_LIMIT }])
    .toArray();
};
