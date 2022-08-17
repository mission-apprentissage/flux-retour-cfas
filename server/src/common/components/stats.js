const { DossierApprenantModel } = require("../../common/model");

module.exports = () => {
  return {
    getNbDistinctCfasByUai,
  };
};

const getNbDistinctCfasByUai = async (filters = {}) => {
  const distinctCfas = await DossierApprenantModel.distinct("uai_etablissement", filters);
  return distinctCfas ? distinctCfas.length : 0;
};
