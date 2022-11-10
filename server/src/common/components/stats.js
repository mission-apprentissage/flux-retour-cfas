const { dossiersApprenantsDb } = require("../model/collections");

module.exports = () => {
  return {
    getNbDistinctCfasByUai,
  };
};

const getNbDistinctCfasByUai = async (filters = {}) => {
  const distinctCfas = await dossiersApprenantsDb().distinct("uai_etablissement", filters);
  return distinctCfas ? distinctCfas.length : 0;
};
