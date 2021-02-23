const { Formation } = require("../model");
const { validateCfd } = require("../domain/cfd");
const { getCfdInfo } = require("../apis/apiTablesCorrespondances");

module.exports = () => ({
  createFormation,
  existsFormation,
  getFormationWithCfd,
});

/**
 * Checks if formation with given CFD exists
 * @param {string} cfd
 * @return {boolean} Does it exist
 */
const existsFormation = async (cfd) => {
  const count = await Formation.countDocuments({ cfd });
  return count !== 0;
};

/**
 * Returns formation if found with given CFD
 * @param {string} cfd
 * @return {Formation | null} Found formation
 */
const getFormationWithCfd = (cfd) => Formation.findOne({ cfd }).lean();

const buildFormationLibelle = (formationFromTCO) => {
  return formationFromTCO.intitule_long || "";
};

/**
 * Fetches data for given CFD in Tables de Correspondances and create a new Formation in DB
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
    const newFormation = new Formation({
      cfd,
      libelle: buildFormationLibelle(formationInfo),
      created_at: new Date(),
    });

    const saved = await newFormation.save();
    return saved.toObject();
  }
  return null;
};
