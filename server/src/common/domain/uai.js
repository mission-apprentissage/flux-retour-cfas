/*
  UAI stands for Unité Administrative Immatriculée, a code used in the
  Répertoire National des Etablissements (RNE) to identify collèges, lycées, CFA...
*/

const validateUai = (uai) => {
  return Boolean(uai) && /^[0-9_]{7}[a-zA-Z]{1}$/.test(uai);
};

module.exports = {
  validateUai,
};
