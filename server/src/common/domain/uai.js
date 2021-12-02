/*
  UAI stands for Unité Administrative Immatriculée, a code used in the
  Répertoire National des Etablissements (RNE) to identify collèges, lycées, CFA...
*/

const uaiRegex = /^[0-9_]{7}[a-zA-Z]{1}$/;
const validateUai = (uai) => Boolean(uai) && uaiRegex.test(uai);

module.exports = {
  validateUai,
  uaiRegex,
};
