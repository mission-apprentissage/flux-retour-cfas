const { Formation: FormationModel, StatutCandidat: StatutCandidatModel } = require("../model");
const { validateCfd } = require("../domain/cfd");
const { getCfdInfo } = require("../apis/apiTablesCorrespondances");
const { Formation } = require("../domain/formation");

module.exports = () => ({
  createFormation,
  existsFormation,
  getFormationWithCfd,
  searchFormationByIntituleOrCfd,
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

  if (formationInfo) {
    const formation = Formation.create({
      cfd,
      libelle: buildFormationLibelle(formationInfo),
      niveau: formationInfo.niveau,
    });
    const newFormationDocument = new FormationModel(formation);
    const saved = await newFormationDocument.save();
    return saved.toObject();
  }
  return null;
};

/**
 * Returns list of CFA information whose nom_etablissement matches input
 * @param {string} intitule
 * @return {[Formation]} Array of CFA information
 */
const searchFormationByIntituleOrCfd = async (intituleOrCfd, otherFilters) => {
  const searchTermFilterQuery = {
    $or: [{ $text: { $search: intituleOrCfd } }, { cfd: new RegExp(intituleOrCfd, "g") }],
  };

  if (otherFilters && Object.keys(otherFilters).length > 0) {
    const filters = {
      id_formation_valid: true,
      ...otherFilters,
    };

    const eligibleCfds = await StatutCandidatModel.distinct("id_formation", filters);

    return FormationModel.find({
      ...searchTermFilterQuery,
      cfd: { $in: eligibleCfds },
    }).lean();
  }

  return FormationModel.find(searchTermFilterQuery).lean();
};
