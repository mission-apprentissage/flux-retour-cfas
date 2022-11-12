import { dossiersApprenantsDb } from "../model/collections";

/**
 * Récupération du nb distinct de cfas via leurs UAI
 * @param {*} filters
 * @returns
 */
const getNbDistinctCfasByUai = async (filters = {}) => {
  const distinctCfas = await dossiersApprenantsDb().distinct("uai_etablissement", filters);
  return distinctCfas ? distinctCfas.length : 0;
};

export default () => ({
  getNbDistinctCfasByUai,
});
