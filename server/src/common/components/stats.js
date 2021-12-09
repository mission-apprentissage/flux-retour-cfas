const { StatutCandidat } = require("../../common/model");

module.exports = () => {
  return {
    getNbDistinctCfasByUai,
    getNbDistinctCfasBySiret,
  };
};

const getNbDistinctCfasByUai = async (filters = {}) => {
  const distinctCfas = await StatutCandidat.distinct("uai_etablissement", {
    ...filters,
    uai_etablissement_valid: true,
  });
  return distinctCfas ? distinctCfas.length : 0;
};

const getNbDistinctCfasBySiret = async (filters = {}) => {
  const distinctCfas = await StatutCandidat.distinct("siret_etablissement", {
    ...filters,
    siret_etablissement_valid: true,
  });
  return distinctCfas ? distinctCfas.length : 0;
};
