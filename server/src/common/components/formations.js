const { Formation: FormationModel, StatutCandidat: StatutCandidatModel } = require("../model");
const { validateCfd } = require("../domain/cfd");
const { getCfdInfo } = require("../apis/apiTablesCorrespondances");
const { getMetiersByCfd } = require("../apis/apiLba");

const { Formation } = require("../domain/formation");

module.exports = () => ({
  createFormation,
  existsFormation,
  getFormationWithCfd,
  searchFormations,
});

/**
 * Checks if formation with given CFD exists
 * @param {string} cfd
 * @return {boolean} Does it exist
 */
const existsFormation = async (cfd) => {
  const count = await FormationModel.countDocuments({ cfd });
  return count !== 0;
};

/**
 * Returns formation if found with given CFD
 * @param {string} cfd
 * @return {Formation | null} Found formation
 */
const getFormationWithCfd = (cfd) => FormationModel.findOne({ cfd }).lean();

const buildFormationLibelle = (formationFromTCO) => {
  return formationFromTCO.intitule_long || "";
};

/**
 * Fetches data for given CFD in Tables de Correspondances and creates a new Formation in DB
 * @param {string} cfd
 * @return {Formation | null} The newly created Formation or null
 */
const createFormation = async (cfd) => {
  if (!validateCfd(cfd)) {
    throw Error("Invalid CFD");
  }

  const alreadyExists = await existsFormation(cfd);
  if (alreadyExists) {
    throw new Error(`A Formation with CFD ${cfd} already exists`);
  }

  const formationInfo = await getCfdInfo(cfd);
  const metiersFromCfd = await getMetiersByCfd(cfd);
  const formationEntity = Formation.create({
    cfd,
    libelle: buildFormationLibelle(formationInfo),
    niveau: formationInfo?.niveau,
    metiers: metiersFromCfd?.metiers,
  });

  if (formationEntity) {
    const newFormationDocument = new FormationModel(formationEntity);
    const saved = await newFormationDocument.save();
    return saved.toObject();
  }
  return null;
};

/**
 * Returns list of CFA information whose nom_etablissement matches input
 * @param {Object} searchCriteria
 * @return {[Formation]} Array of CFA information
 */
const searchFormations = async (searchCriteria) => {
  const { searchTerm, ...otherFilters } = searchCriteria;
  const searchTermFilterQuery = searchTerm
    ? {
        $or: [{ $text: { $search: searchTerm } }, { cfd: new RegExp(searchTerm, "g") }],
      }
    : {};

  if (Object.keys(otherFilters).length > 0) {
    const filters = {
      formation_cfd_valid: true,
      ...otherFilters,
    };

    const eligibleCfds = await StatutCandidatModel.distinct("formation_cfd", filters);

    return FormationModel.find({
      ...searchTermFilterQuery,
      cfd: { $in: eligibleCfds },
    }).lean();
  }

  return FormationModel.find(searchTermFilterQuery).lean();
};
